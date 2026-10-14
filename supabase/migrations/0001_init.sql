-- Extensions
create extension if not exists "pgcrypto";

-- ============ Tables ============

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'staff')),
  name text not null,
  created_at timestamptz not null default now()
);

-- NOTE: tax and discount handling are explicitly out of scope for now,
-- pending the client's answer on tax status. No tax/discount columns exist
-- anywhere in this schema yet.
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  barcode text unique,
  base_unit text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  bundle_unit text,
  qty_per_bundle integer check (qty_per_bundle is null or qty_per_bundle > 0),
  bundle_price numeric(12,2) check (bundle_price is null or bundle_price >= 0),
  stock_qty numeric(12,3) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bundle_fields_consistent check (
    (bundle_unit is null and qty_per_bundle is null and bundle_price is null)
    or (bundle_unit is not null and qty_per_bundle is not null and bundle_price is not null)
  )
);

create table stock_adjustments (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete restrict,
  change_qty numeric(12,3) not null, -- positive = restock, negative = correction/loss
  reason text not null,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create sequence invoice_number_seq;

create table invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique, -- assigned on completion only
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'completed')),
  payment_method text check (payment_method in ('cash', 'other')),
  amount_tendered numeric(12,2),
  change_due numeric(12,2),
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name_snapshot text not null,
  unit_sold text not null,
  qty numeric(12,3) not null check (qty > 0),
  base_unit_qty numeric(12,3) not null, -- qty converted to base units, for stock decrement
  original_price numeric(12,2) not null,
  final_price numeric(12,2) not null,
  line_total numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create index on invoices (status);
create index on invoices (created_by);
create index on invoice_items (invoice_id);
create index on stock_adjustments (product_id);

-- ============ Helper functions ============

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from profiles where id = uid and role = 'admin');
$$;

create or replace function public.next_invoice_number()
returns text
language sql
as $$
  select 'INV-' || lpad(nextval('invoice_number_seq')::text, 6, '0');
$$;

-- Atomically completes a draft invoice: validates + decrements stock,
-- assigns invoice_number, records payment info.
create or replace function public.complete_invoice(
  p_invoice_id uuid,
  p_payment_method text,
  p_amount_tendered numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_total numeric;
  v_item record;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select status, total into v_status, v_total
    from invoices where id = p_invoice_id for update;

  if v_status is null then
    raise exception 'Invoice not found';
  end if;
  if v_status <> 'draft' then
    raise exception 'Invoice is already completed';
  end if;

  for v_item in
    select product_id, base_unit_qty
    from invoice_items
    where invoice_id = p_invoice_id and product_id is not null
  loop
    update products
      set stock_qty = stock_qty - v_item.base_unit_qty
      where id = v_item.product_id and stock_qty >= v_item.base_unit_qty;
    if not found then
      raise exception 'Insufficient stock for product %', v_item.product_id;
    end if;
  end loop;

  update invoices
    set status = 'completed',
        completed_at = now(),
        invoice_number = public.next_invoice_number(),
        payment_method = p_payment_method,
        amount_tendered = p_amount_tendered,
        change_due = coalesce(p_amount_tendered, 0) - v_total
    where id = p_invoice_id;
end;
$$;

-- Admin-only stock adjustment: updates stock and writes the log row atomically.
create or replace function public.adjust_stock(
  p_product_id uuid,
  p_change_qty numeric,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only admin can adjust stock';
  end if;

  update products
    set stock_qty = stock_qty + p_change_qty, updated_at = now()
    where id = p_product_id;
  if not found then
    raise exception 'Product not found';
  end if;

  insert into stock_adjustments (product_id, change_qty, reason, created_by)
    values (p_product_id, p_change_qty, p_reason, auth.uid());
end;
$$;

grant execute on function public.complete_invoice to authenticated;
grant execute on function public.adjust_stock to authenticated;

-- ============ RLS ============

alter table profiles enable row level security;
alter table products enable row level security;
alter table stock_adjustments enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;

-- profiles: see your own row, or all rows if admin
create policy "profiles_select_own_or_admin" on profiles
  for select using (id = auth.uid() or is_admin(auth.uid()));

create policy "profiles_insert_admin" on profiles
  for insert with check (is_admin(auth.uid()));

create policy "profiles_update_admin" on profiles
  for update using (is_admin(auth.uid()));

-- products: any authenticated user can read; only admin can write
create policy "products_select_authenticated" on products
  for select using (auth.uid() is not null);

create policy "products_insert_admin" on products
  for insert with check (is_admin(auth.uid()));

create policy "products_update_admin" on products
  for update using (is_admin(auth.uid()));

create policy "products_delete_admin" on products
  for delete using (is_admin(auth.uid()));

-- stock_adjustments: admin only (writes normally go through adjust_stock RPC)
create policy "stock_adjustments_select_admin" on stock_adjustments
  for select using (is_admin(auth.uid()));

create policy "stock_adjustments_insert_admin" on stock_adjustments
  for insert with check (is_admin(auth.uid()));

-- invoices: any authenticated user can read all invoices (drafts + completed)
create policy "invoices_select_authenticated" on invoices
  for select using (auth.uid() is not null);

create policy "invoices_insert_authenticated" on invoices
  for insert with check (auth.uid() is not null and status = 'draft' and created_by = auth.uid());

-- Only drafts can be edited directly; completion happens via complete_invoice() RPC
create policy "invoices_update_draft_only" on invoices
  for update using (status = 'draft') with check (status = 'draft');

create policy "invoices_delete_draft_only" on invoices
  for delete using (status = 'draft');

-- invoice_items: follow the parent invoice's draft/completed state
create policy "invoice_items_select_authenticated" on invoice_items
  for select using (auth.uid() is not null);

create policy "invoice_items_insert_draft_only" on invoice_items
  for insert with check (
    exists (select 1 from invoices i where i.id = invoice_id and i.status = 'draft')
  );

create policy "invoice_items_update_draft_only" on invoice_items
  for update using (
    exists (select 1 from invoices i where i.id = invoice_id and i.status = 'draft')
  );

create policy "invoice_items_delete_draft_only" on invoice_items
  for delete using (
    exists (select 1 from invoices i where i.id = invoice_id and i.status = 'draft')
  );
