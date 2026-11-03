-- RSK-nummer i elevens materialplan och i beställningar.
--
-- Eleven skriver RSK i materialplanen. När läraren gör en beställning av
-- planen följer RSK med, och kan matchas mot material_catalog för att göra
-- QR-etiketter. source_plan_item_id gör att samma planrad inte kan bli
-- beställd två gånger.

alter table public.material_plan_items
  add column if not exists rsk_number text not null default '';

alter table public.material_orders
  add column if not exists rsk_number text not null default '',
  add column if not exists source_plan_item_id uuid references public.material_plan_items (id) on delete set null;

create unique index if not exists material_orders_source_plan_item_uidx
  on public.material_orders (source_plan_item_id)
  where source_plan_item_id is not null;
