-- Prevent stock_qty from ever going negative via adjust_stock (or any other
-- direct update). complete_invoice() already guards this per-line before
-- decrementing; this is the equivalent guard for manual adjustments.
alter table products
  add constraint products_stock_qty_non_negative check (stock_qty >= 0);
