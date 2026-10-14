-- Generalize the single optional bundle tier (bundle_unit/qty_per_bundle/
-- bundle_price) into unlimited higher tiers per product (e.g. Box, Master
-- Case), each with its own name, base-unit conversion rate, price, and
-- optional barcode — so a cashier scanning any tier's barcode rings up the
-- right unit.
create table product_units (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  unit_name text not null,
  qty_in_base integer not null check (qty_in_base > 1),
  price numeric(12,2) not null check (price >= 0),
  barcode text unique,
  created_at timestamptz not null default now(),
  unique (product_id, unit_name)
);

create index on product_units (product_id);

alter table product_units enable row level security;

create policy "product_units_select_authenticated" on product_units
  for select using (auth.uid() is not null);

create policy "product_units_insert_admin" on product_units
  for insert with check (is_admin(auth.uid()));

create policy "product_units_update_admin" on product_units
  for update using (is_admin(auth.uid()));

create policy "product_units_delete_admin" on product_units
  for delete using (is_admin(auth.uid()));

-- Migrate any existing single-bundle data into the new table.
insert into product_units (product_id, unit_name, qty_in_base, price)
select id, bundle_unit, qty_per_bundle, bundle_price
from products
where bundle_unit is not null;

-- Superseded by product_units.
alter table products drop constraint bundle_fields_consistent;
alter table products drop column bundle_unit;
alter table products drop column qty_per_bundle;
alter table products drop column bundle_price;
