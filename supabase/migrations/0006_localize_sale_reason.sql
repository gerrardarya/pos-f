-- Localization pass: stock_adjustments rows written for completed sales
-- now say "Penjualan <invoice_number>" instead of "Sale <invoice_number>",
-- matching the Indonesian UI's is_sale detection (reason starts with
-- "Penjualan "). Only affects new rows going forward.
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
  v_invoice_number text;
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

  v_invoice_number := public.next_invoice_number();

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

    insert into stock_adjustments (product_id, change_qty, reason, created_by)
      values (v_item.product_id, -v_item.base_unit_qty, 'Penjualan ' || v_invoice_number, auth.uid());
  end loop;

  update invoices
    set status = 'completed',
        completed_at = now(),
        invoice_number = v_invoice_number,
        payment_method = p_payment_method,
        amount_tendered = p_amount_tendered,
        change_due = coalesce(p_amount_tendered, 0) - v_total
    where id = p_invoice_id;
end;
$$;
