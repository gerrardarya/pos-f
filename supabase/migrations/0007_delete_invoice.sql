-- Admin-only invoice deletion. Drafts delete outright (no stock was ever
-- decremented). Completed invoices first reverse their stock impact —
-- restoring stock_qty and logging a compensating stock_adjustments entry
-- per line item, the same way complete_invoice() logs the original sale —
-- so inventory stays accurate after the record is gone.
create or replace function public.delete_invoice(p_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_invoice_number text;
  v_item record;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only admin can delete invoices';
  end if;

  select status, invoice_number into v_status, v_invoice_number
    from invoices where id = p_invoice_id for update;

  if v_status is null then
    raise exception 'Invoice not found';
  end if;

  if v_status = 'completed' then
    for v_item in
      select product_id, base_unit_qty
      from invoice_items
      where invoice_id = p_invoice_id and product_id is not null
    loop
      update products
        set stock_qty = stock_qty + v_item.base_unit_qty, updated_at = now()
        where id = v_item.product_id;

      insert into stock_adjustments (product_id, change_qty, reason, created_by)
        values (
          v_item.product_id,
          v_item.base_unit_qty,
          'Pembatalan ' || coalesce(v_invoice_number, p_invoice_id::text),
          auth.uid()
        );
    end loop;
  end if;

  delete from invoices where id = p_invoice_id;
end;
$$;

grant execute on function public.delete_invoice to authenticated;
