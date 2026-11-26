create extension if not exists pgcrypto;

-- ============ HELPERS ============
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ============ ADMINS ============
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

-- ============ CATALOG ============
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ar text not null,
  name_en text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category_id uuid references public.categories(id) on delete set null,
  title_ar text not null,
  title_en text,
  description_ar text,
  description_en text,
  base_price integer not null check (base_price > 0), -- whole EGP
  is_new boolean not null default true,
  is_active boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists products_updated on public.products;
create trigger products_updated before update on public.products
  for each row execute function public.set_updated_at();

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  storage_path text, -- null for external/Unsplash seed images; populated for Storage uploads
  sort_order int not null default 0,
  is_primary boolean not null default false,
  color_name text, -- null = shown for all colors
  color_hex text
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null,
  color_name text not null,
  color_hex text,
  sku text,
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  unique (product_id, size, color_name)
);

-- product_id NULL = global rule. Per-product rules replace global rules for that product.
create table if not exists public.discount_tiers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  min_qty integer not null check (min_qty >= 2),
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  value integer not null check (value > 0),
  is_active boolean not null default true,
  check (discount_type <> 'percent' or value <= 90)
);

create unique index if not exists discount_tiers_unique
  on public.discount_tiers (coalesce(product_id, '00000000-0000-0000-0000-000000000000'::uuid), min_qty);

create index if not exists product_variants_product_idx on public.product_variants (product_id);
create index if not exists product_images_product_idx on public.product_images (product_id);
create index if not exists products_category_idx on public.products (category_id);

-- ============ SHIPPING (27 GOVERNORATES) ============
create table if not exists public.governorate_shipping (
  id smallint primary key,
  name_ar text not null,
  name_en text not null,
  fee integer not null default 0 check (fee >= 0),
  is_active boolean not null default true,
  sort_order smallint not null default 0
);

-- ============ STORE SETTINGS ============
create table if not exists public.store_settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default false
);

-- ============ ORDERS ============
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_ref text not null unique,
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'sent_to_shipping', 'delivered', 'cancelled', 'returned')),
  customer_name text not null,
  phone text not null check (phone ~ '^01[0125][0-9]{8}$'),
  phone_secondary text check (phone_secondary is null or phone_secondary ~ '^01[0125][0-9]{8}$'),
  governorate_id smallint references public.governorate_shipping(id),
  governorate_name text not null,
  city_area text not null,
  address_details text not null,
  notes text,
  internal_notes text,
  subtotal_original integer not null default 0,
  discount_total integer not null default 0,
  shipping_fee integer not null default 0,
  total_cod integer not null default 0,
  stock_restocked boolean not null default false,
  idempotency_key uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists orders_updated on public.orders;
create trigger orders_updated before update on public.orders
  for each row execute function public.set_updated_at();

create index if not exists orders_status_created_idx on public.orders (status, created_at desc);
create index if not exists orders_phone_idx on public.orders (phone);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_title text not null,
  size text not null,
  color text not null,
  image_url text,
  unit_price integer not null,
  quantity integer not null check (quantity > 0),
  line_original integer not null,
  line_discount integer not null default 0,
  line_total integer not null,
  tier_min_qty integer
);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_product_idx on public.order_items (product_id);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists order_status_history_order_idx on public.order_status_history (order_id);

-- ============ FUNCTIONS & RPCS ============
create or replace function public.normalize_eg_phone(t text) returns text
language sql immutable set search_path = public as $$
  select case
    when s ~ '^\+?20[0-9]{10}$' then '0' || regexp_replace(s, '^\+?20', '')
    when s ~ '^0020[0-9]{10}$' then '0' || substr(s, 5)
    else s end
  from (
    select regexp_replace(
      translate(coalesce(t, ''), '٠١٢٣٤٥٦٧٨٩', '0123456789'),
      '[\s\-\(\)]', '', 'g'
    ) as s
  ) x;
$$;

create or replace function public.generate_order_ref() returns text
language plpgsql set search_path = public as $$
declare v text;
begin
  loop
    v := 'WNT-' || (100000 + floor(random() * 900000))::int::text;
    exit when not exists (select 1 from public.orders where order_ref = v);
  end loop;
  return v;
end $$;

create or replace function public.group_discount(p_product uuid, p_qty int, p_group_original int)
returns table (tier_min_qty int, discount int)
language sql stable set search_path = public as $$
  with scope as (
    select case
      when exists (select 1 from public.discount_tiers where is_active and product_id = p_product)
      then p_product else null::uuid end as pid
  ), best as (
    select t.min_qty, t.discount_type, t.value
    from public.discount_tiers t, scope s
    where t.is_active and t.min_qty <= p_qty and t.product_id is not distinct from s.pid
    order by t.min_qty desc limit 1
  )
  select b.min_qty,
    case b.discount_type
      when 'percent' then round(p_group_original * b.value / 100.0)::int
      else least(b.value, p_group_original)
    end
  from best b;
$$;

create or replace function public.create_guest_order(p jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_key uuid := nullif(p->>'idempotency_key', '')::uuid;
  v_name text := btrim(coalesce(p->>'customer_name', ''));
  v_phone text := public.normalize_eg_phone(p->>'phone');
  v_phone2 text := nullif(public.normalize_eg_phone(p->>'phone_secondary'), '');
  v_city text := btrim(coalesce(p->>'city_area', ''));
  v_addr text := btrim(coalesce(p->>'address_details', ''));
  v_notes text := nullif(btrim(coalesce(p->>'notes', '')), '');
  v_gov public.governorate_shipping%rowtype;
  v_items jsonb; v_bad jsonb;
  v_threshold int := 0;
  v_order_id uuid; v_ref text;
  v_sub int := 0; v_disc int := 0; v_ship int; v_total int;
  g record; r record;
  v_grp_orig int; v_grp_disc int; v_tier int; v_remaining int;
  v_n int; v_i int; v_line_orig int; v_line_disc int; v_existing public.orders%rowtype;
begin
  if v_key is not null then
    select * into v_existing from public.orders where idempotency_key = v_key;
    if found then
      return jsonb_build_object('order_ref', v_existing.order_ref, 'total_cod', v_existing.total_cod, 'duplicate', true);
    end if;
  end if;

  if char_length(v_name) < 3 or char_length(v_name) > 100 then raise exception 'INVALID_NAME'; end if;
  if v_phone !~ '^01[0125][0-9]{8}$' then raise exception 'INVALID_PHONE'; end if;
  if v_phone2 is not null and v_phone2 !~ '^01[0125][0-9]{8}$' then raise exception 'INVALID_PHONE2'; end if;
  if char_length(v_city) < 2 or char_length(v_addr) < 5 then raise exception 'INVALID_ADDRESS'; end if;
  if jsonb_typeof(p->'items') <> 'array' or jsonb_array_length(p->'items') not between 1 and 30 then
    raise exception 'INVALID_ITEMS';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p->'items') i
    where coalesce((i->>'quantity')::int, 0) not between 1 and 10
  ) then
    raise exception 'INVALID_QUANTITY';
  end if;

  select * into v_gov from public.governorate_shipping
  where id = (p->>'governorate_id')::smallint and is_active;
  if not found then raise exception 'INVALID_GOVERNORATE'; end if;

  if (select count(*) from public.orders where phone = v_phone and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'RATE_LIMITED';
  end if;

  select jsonb_agg(jsonb_build_object('variant_id', variant_id, 'qty', qty)) into v_items
  from (
    select (i->>'variant_id')::uuid as variant_id, sum((i->>'quantity')::int) as qty
    from jsonb_array_elements(p->'items') i group by 1
  ) s;

  perform 1 from public.product_variants
  where id in (select (x->>'variant_id')::uuid from jsonb_array_elements(v_items) x)
  order by id for update;

  select jsonb_agg(jsonb_build_object('variant_id', q.variant_id, 'requested', q.qty, 'available', coalesce(v.stock, 0)))
  into v_bad
  from jsonb_to_recordset(v_items) as q(variant_id uuid, qty int)
  left join public.product_variants v on v.id = q.variant_id
  left join public.products pr on pr.id = v.product_id
  where v.id is null or not v.is_active or pr.is_archived or not pr.is_active or v.stock < q.qty;

  if v_bad is not null then
    raise exception 'STOCK_UNAVAILABLE' using detail = v_bad::text;
  end if;

  v_ref := public.generate_order_ref();
  insert into public.orders (
    order_ref, customer_name, phone, phone_secondary, governorate_id,
    governorate_name, city_area, address_details, notes, idempotency_key
  ) values (
    v_ref, v_name, v_phone, v_phone2, v_gov.id,
    v_gov.name_ar, v_city, v_addr, v_notes, v_key
  ) returning id into v_order_id;

  for g in
    select pr.id as product_id, pr.base_price, sum(q.qty)::int as qty
    from jsonb_to_recordset(v_items) as q(variant_id uuid, qty int)
    join public.product_variants v on v.id = q.variant_id
    join public.products pr on pr.id = v.product_id
    group by pr.id, pr.base_price
  loop
    v_grp_orig := g.base_price * g.qty;
    select gd.tier_min_qty, gd.discount into v_tier, v_grp_disc
    from public.group_discount(g.product_id, g.qty, v_grp_orig) gd;
    v_grp_disc := coalesce(v_grp_disc, 0);
    v_remaining := v_grp_disc;

    select count(*) into v_n
    from jsonb_to_recordset(v_items) as q(variant_id uuid, qty int)
    join public.product_variants v on v.id = q.variant_id
    where v.product_id = g.product_id;
    v_i := 0;

    for r in
      select v.id as variant_id, v.size, v.color_name, q.qty, pr.title_ar,
        (select url from public.product_images pi where pi.product_id = pr.id order by is_primary desc, sort_order limit 1) as image_url
      from jsonb_to_recordset(v_items) as q(variant_id uuid, qty int)
      join public.product_variants v on v.id = q.variant_id
      join public.products pr on pr.id = v.product_id
      where pr.id = g.product_id
      order by v.id
    loop
      v_i := v_i + 1;
      v_line_orig := g.base_price * r.qty;
      v_line_disc := case when v_i = v_n then v_remaining
                          else round(v_grp_disc::numeric * v_line_orig / v_grp_orig)::int end;
      v_line_disc := greatest(0, least(v_line_orig, v_line_disc));
      v_remaining := v_remaining - v_line_disc;

      insert into public.order_items (
        order_id, product_id, variant_id, product_title, size, color,
        image_url, unit_price, quantity, line_original, line_discount, line_total, tier_min_qty
      ) values (
        v_order_id, g.product_id, r.variant_id, r.title_ar, r.size, r.color_name,
        r.image_url, g.base_price, r.qty, v_line_orig, v_line_disc, v_line_orig - v_line_disc, v_tier
      );

      update public.product_variants set stock = stock - r.qty where id = r.variant_id;
      v_sub := v_sub + v_line_orig;
      v_disc := v_disc + v_line_disc;
    end loop;
  end loop;

  select coalesce((value #>> '{}')::int, 0) into v_threshold
  from public.store_settings where key = 'free_shipping_threshold';
  v_ship := case when coalesce(v_threshold, 0) > 0 and (v_sub - v_disc) >= v_threshold then 0 else v_gov.fee end;
  v_total := v_sub - v_disc + v_ship;

  update public.orders set subtotal_original = v_sub, discount_total = v_disc,
    shipping_fee = v_ship, total_cod = v_total where id = v_order_id;
  insert into public.order_status_history (order_id, from_status, to_status, note)
    values (v_order_id, null, 'new', 'Order created');

  return jsonb_build_object('order_ref', v_ref, 'total_cod', v_total, 'duplicate', false);
end $$;

create or replace function public.track_order(p_ref text, p_phone text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'order_ref', o.order_ref, 'status', o.status, 'created_at', o.created_at,
    'governorate', o.governorate_name, 'total_cod', o.total_cod,
    'items', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'title', i.product_title, 'size', i.size, 'color', i.color, 'quantity', i.quantity
      )), '[]'::jsonb)
      from public.order_items i where i.order_id = o.id
    )
  )
  from public.orders o
  where o.order_ref = upper(btrim(p_ref)) and o.phone = public.normalize_eg_phone(p_phone);
$$;

create or replace function public.admin_update_order_status(
  p_order_id uuid, p_new_status text, p_note text default null, p_restock boolean default true
) returns void language plpgsql security definer set search_path = public as $$
declare o public.orders%rowtype; ok boolean;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  select * into o from public.orders where id = p_order_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;

  ok := (o.status = 'new' and p_new_status in ('confirmed', 'cancelled'))
     or (o.status = 'confirmed' and p_new_status in ('sent_to_shipping', 'cancelled'))
     or (o.status = 'sent_to_shipping' and p_new_status in ('delivered', 'returned', 'cancelled'))
     or (o.status = 'delivered' and p_new_status = 'returned');
  if not ok then raise exception 'INVALID_TRANSITION'; end if;

  if p_new_status in ('cancelled', 'returned') and p_restock and not o.stock_restocked then
    update public.product_variants v set stock = v.stock + i.quantity
    from public.order_items i where i.order_id = o.id and i.variant_id = v.id;
    update public.orders set stock_restocked = true where id = o.id;
  end if;

  update public.orders set status = p_new_status where id = o.id;
  insert into public.order_status_history (order_id, from_status, to_status, changed_by, note)
    values (o.id, o.status, p_new_status, (select auth.uid()), p_note);
end $$;

create or replace function public.admin_delete_product(p_product_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_paths jsonb;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if exists (select 1 from public.order_items where product_id = p_product_id) then
    raise exception 'HAS_ORDERS';
  end if;

  select coalesce(jsonb_agg(storage_path) filter (where storage_path is not null), '[]'::jsonb)
  into v_paths from public.product_images where product_id = p_product_id;

  delete from public.products where id = p_product_id;
  return jsonb_build_object('storage_paths', v_paths);
end $$;

-- ============ RLS ============
do $$ declare t text; begin
  foreach t in array array[
    'categories','products','product_images','product_variants',
    'discount_tiers','governorate_shipping','store_settings',
    'orders','order_items','order_status_history','admins'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', 'admin all ' || t, t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', 'admin all ' || t, t);
  end loop;
end $$;

drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select to anon, authenticated using (is_active);
drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products for select to anon, authenticated using (is_active and not is_archived);
drop policy if exists "public read images" on public.product_images;
create policy "public read images" on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.is_active and not p.is_archived));
drop policy if exists "public read variants" on public.product_variants;
create policy "public read variants" on public.product_variants for select to anon, authenticated using (is_active);
drop policy if exists "public read tiers" on public.discount_tiers;
create policy "public read tiers" on public.discount_tiers for select to anon, authenticated using (is_active);
drop policy if exists "public read shipping" on public.governorate_shipping;
create policy "public read shipping" on public.governorate_shipping for select to anon, authenticated using (is_active);
drop policy if exists "public read settings" on public.store_settings;
create policy "public read settings" on public.store_settings for select to anon, authenticated using (is_public);

revoke all on public.orders, public.order_items, public.order_status_history, public.admins from anon;
revoke execute on function public.create_guest_order(jsonb), public.track_order(text, text),
  public.admin_update_order_status(uuid, text, text, boolean), public.admin_delete_product(uuid),
  public.is_admin() from public, anon;
grant execute on function public.create_guest_order(jsonb), public.track_order(text, text) to anon, authenticated;
grant execute on function public.admin_update_order_status(uuid, text, text, boolean), public.admin_delete_product(uuid),
  public.is_admin() to authenticated;

-- Realtime for admin orders
do $$ begin
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;

-- ============ SUPABASE STORAGE BUCKET: `products` ============
insert into storage.buckets (id, name, public) values ('products', 'products', true)
  on conflict (id) do nothing;

drop policy if exists "public read products bucket" on storage.objects;
create policy "public read products bucket" on storage.objects for select using (bucket_id = 'products');

-- NOTE: storage policies use inline EXISTS instead of is_admin() to avoid SECURITY DEFINER
-- JWT context issue when is_admin() runs inside the storage service's RLS evaluation.
drop policy if exists "admin insert products bucket" on storage.objects;
create policy "admin insert products bucket" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'products'
    and exists (select 1 from public.admins where user_id = auth.uid())
  );

drop policy if exists "admin update products bucket" on storage.objects;
create policy "admin update products bucket" on storage.objects for update to authenticated
  using (
    bucket_id = 'products'
    and exists (select 1 from public.admins where user_id = auth.uid())
  )
  with check (
    bucket_id = 'products'
    and exists (select 1 from public.admins where user_id = auth.uid())
  );

drop policy if exists "admin delete products bucket" on storage.objects;
create policy "admin delete products bucket" on storage.objects for delete to authenticated
  using (
    bucket_id = 'products'
    and exists (select 1 from public.admins where user_id = auth.uid())
  );

-- ============ SEED: ALL 27 EGYPTIAN GOVERNORATES ============
insert into public.governorate_shipping (id, name_ar, name_en, fee, sort_order) values
 (1,'القاهرة','Cairo',60,1),(2,'الجيزة','Giza',60,2),(3,'الإسكندرية','Alexandria',70,3),
 (4,'القليوبية','Qalyubia',65,4),(5,'بورسعيد','Port Said',80,5),(6,'السويس','Suez',80,6),
 (7,'الدقهلية','Dakahlia',75,7),(8,'الشرقية','Sharqia',75,8),(9,'الغربية','Gharbia',75,9),
 (10,'المنوفية','Monufia',75,10),(11,'البحيرة','Beheira',75,11),(12,'كفر الشيخ','Kafr El Sheikh',80,12),
 (13,'دمياط','Damietta',80,13),(14,'الإسماعيلية','Ismailia',80,14),(15,'الفيوم','Fayoum',85,15),
 (16,'بني سويف','Beni Suef',85,16),(17,'المنيا','Minya',90,17),(18,'أسيوط','Asyut',95,18),
 (19,'سوهاج','Sohag',95,19),(20,'قنا','Qena',100,20),(21,'الأقصر','Luxor',100,21),
 (22,'أسوان','Aswan',105,22),(23,'البحر الأحمر','Red Sea',110,23),(24,'الوادي الجديد','New Valley',120,24),
 (25,'مطروح','Matrouh',110,25),(26,'شمال سيناء','North Sinai',120,26),(27,'جنوب سيناء','South Sinai',120,27)
on conflict (id) do nothing;

-- ============ SEED: SETTINGS ============
insert into public.store_settings (key, value, is_public) values
 ('free_shipping_threshold', '2500', true),
 ('whatsapp_number', '"201001234567"', true),
 ('low_stock_threshold', '3', false),
 ('courier_template', to_jsonb(
'الاسم: {name}
الموبايل: {phone}{phone2_line}
المحافظة: {governorate}
العنوان: {city_area} - {address}
القطع:
{items}
الإجمالي (كاش): {total} ج.م
رقم الأوردر: {ref}{notes_line}'::text), false)
on conflict (key) do nothing;

-- ============ SEED: CATEGORIES (EDITABLE VIA ADMIN) ============
insert into public.categories (id, slug, name_ar, name_en, sort_order) values
 ('10000000-0000-4000-8000-000000000001', 'hoodies',  'هوديز وسويت شيرت', 'Hoodies & Sweatshirts', 1),
 ('10000000-0000-4000-8000-000000000002', 'knitwear', 'تريكو وبلوفرات',   'Knitwear', 2),
 ('10000000-0000-4000-8000-000000000003', 'jackets',  'جواكت وبافر',      'Jackets & Puffers', 3),
 ('10000000-0000-4000-8000-000000000004', 'coats',    'معاطف صوف',        'Wool Coats', 4),
 ('10000000-0000-4000-8000-000000000005', 'pants',    'بناطيل شتوية',     'Winter Pants', 5)
on conflict (id) do nothing;

-- ============ SEED: 7 REALISTIC WINTER PRODUCTS (100% EDITABLE/DELETABLE IN ADMIN) ============
insert into public.products (id, slug, category_id, title_ar, title_en, description_ar, description_en, base_price, is_new) values
 ('20000000-0000-4000-8000-000000000001', 'oversized-heavyweight-hoodie', '10000000-0000-4000-8000-000000000001',
  'هودي أوفر سايز قطن ثقيل 480 جم', 'Oversized Heavyweight Hoodie 480gsm',
  'هودي شتوي ثقيل من القطن المصري الممشط ببطانة ميلتون ناعمة وقصة أوفر سايز عصرية تناسب أجواء الشتاء.',
  'Heavyweight 480gsm Egyptian brushed fleece hoodie with dropped shoulders and structured double-lined hood.', 1150, true),
 ('20000000-0000-4000-8000-000000000002', 'boxy-quarter-zip-knit', '10000000-0000-4000-8000-000000000002',
  'بلوفر تريكو بوكسي بسوسته ربع', 'Boxy Quarter-Zip Knit',
  'تريكو محبوك بغرزة كثيفة وقصة بوكسي أنيقة مع ياقة بسوسته معدنية متينة للتنسيق اليومي.',
  'Dense ribbed knit pullover with a boxy cropped silhouette and brushed metal quarter-zip collar.', 1350, true),
 ('20000000-0000-4000-8000-000000000003', 'minimalist-puffer-jacket', '10000000-0000-4000-8000-000000000003',
  'جاكيت بافر شتوي مبطن ضد الماء', 'Minimalist Water-Resistant Puffer Jacket',
  'جاكيت بافر عازل للحرارة بخامة مطفية مقاومة للرياح والأمطار الخفيفة مع جيوب جانبية بسوسته.',
  'Insulated matte-shell puffer jacket built for cold Egyptian winter nights with storm cuffs and concealed zip pockets.', 2450, true),
 ('20000000-0000-4000-8000-000000000004', 'relaxed-wool-overcoat', '10000000-0000-4000-8000-000000000004',
  'بالطو صوف ريلاكسد بطول متوسط', 'Relaxed Wool Blend Overcoat',
  'معطف صوف فاخر بقصة واسعة مريحة وياقة كلاسيكية، مثالي فوق الهودي أو التريكو لإطلالة شتوية راقية.',
  'Tailored yet relaxed wool-blend overcoat with notched lapels and full satin lining for effortless layering.', 2950, false),
 ('20000000-0000-4000-8000-000000000005', 'fleece-cargo-pants', '10000000-0000-4000-8000-000000000005',
  'بنطلون كارجو فليس ثقيل', 'Heavyweight Fleece Cargo Pants',
  'بنطلون كارجو شتوي مبطن بالفليس الدافئ مع جيوب جانبية عملية وأستك قابل للتعديل عند الكاحل.',
  'Wide-leg heavyweight winter fleece cargo pants with bellows pockets and adjustable hem toggles.', 980, true),
 ('20000000-0000-4000-8000-000000000006', 'waffle-thermal-crewneck', '10000000-0000-4000-8000-000000000001',
  'سويت شيرت وافل حراري أوفر سايز', 'Thermal Waffle Crewneck',
  'قطعة أساسية للشتاء بنسيج الوافل الحراري المريح الذي يحفظ الدفء بدون وزن زائد.',
  'Structured thermal waffle-knit crewneck sweatshirt designed for standalone wear or warm winter layering.', 890, false),
 ('20000000-0000-4000-8000-000000000007', 'sherpa-lined-overshirt', '10000000-0000-4000-8000-000000000003',
  'أوفر شيرت مبطن شيربا دافئ', 'Sherpa-Lined Winter Overshirt',
  'جاكيت قميص شتوي بخامة تويل سميكة وبطانة شيربا ناعمة تمنحك دفئاً مثالياً.',
  'Heavy cotton-twill winter overshirt lined with plush sherpa fleece and horn button closures.', 1650, true)
on conflict (id) do nothing;

-- ============ SEED: PRODUCT IMAGES (2 PER PRODUCT FOR HOVER SWAP) ============
-- SEED: PRODUCT IMAGES — flat-lay / ghost-mannequin product-only shots (no models)
-- Primary images: clean product shots of the garment itself
insert into public.product_images (product_id, url, storage_path, sort_order, is_primary) values
 -- Hoodie 480gsm: cream/beige ghost-mannequin hoodie + knit texture close-up
 ('20000000-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1000&q=80', null, 0, true),
 ('20000000-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1000&q=80', null, 1, false),
 -- Boxy Quarter-Zip Knit: knit flat-lay front + detail
 ('20000000-0000-4000-8000-000000000002', 'https://images.unsplash.com/photo-1614975059251-992f11792b9f?auto=format&fit=crop&w=1000&q=80', null, 0, true),
 ('20000000-0000-4000-8000-000000000002', 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=80', null, 1, false),
 -- Puffer Jacket: flat-lay puffer jacket front + side
 ('20000000-0000-4000-8000-000000000003', 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=1000&q=80', null, 0, true),
 ('20000000-0000-4000-8000-000000000003', 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?auto=format&fit=crop&w=1000&q=80', null, 1, false),
 -- Wool Overcoat: flat-lay overcoat front + detail
 ('20000000-0000-4000-8000-000000000004', 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1000&q=80', null, 0, true),
 ('20000000-0000-4000-8000-000000000004', 'https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=1000&q=80', null, 1, false),
 -- Fleece Cargo Pants: dark charcoal wide-leg sweatpants flat-lay
 ('20000000-0000-4000-8000-000000000005', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80', null, 0, true),
 ('20000000-0000-4000-8000-000000000005', 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=1000&q=80', null, 1, false),
 -- Thermal Waffle Crewneck: flat-lay sweatshirt front + texture detail
 ('20000000-0000-4000-8000-000000000006', 'https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?auto=format&fit=crop&w=1000&q=80', null, 0, true),
 ('20000000-0000-4000-8000-000000000006', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1000&q=80', null, 1, false),
 -- Sherpa-Lined Overshirt: flat-lay heavy overshirt front + back
 ('20000000-0000-4000-8000-000000000007', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1000&q=80', null, 0, true),
 ('20000000-0000-4000-8000-000000000007', 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=1000&q=80', null, 1, false)
on conflict do nothing;

-- ============ SEED: PRODUCT VARIANTS ============
insert into public.product_variants (product_id, size, color_name, color_hex, sku, stock) values
 ('20000000-0000-4000-8000-000000000001','S','زمردي داكن','#124E3B','HD-EMR-S',12),
 ('20000000-0000-4000-8000-000000000001','M','زمردي داكن','#124E3B','HD-EMR-M',18),
 ('20000000-0000-4000-8000-000000000001','L','زمردي داكن','#124E3B','HD-EMR-L',15),
 ('20000000-0000-4000-8000-000000000001','XL','زمردي داكن','#124E3B','HD-EMR-XL',2),
 ('20000000-0000-4000-8000-000000000001','S','بيج كريمي','#E8E3D5','HD-BGE-S',10),
 ('20000000-0000-4000-8000-000000000001','M','بيج كريمي','#E8E3D5','HD-BGE-M',14),
 ('20000000-0000-4000-8000-000000000001','L','بيج كريمي','#E8E3D5','HD-BGE-L',0),
 ('20000000-0000-4000-8000-000000000001','XL','بيج كريمي','#E8E3D5','HD-BGE-XL',8),
 ('20000000-0000-4000-8000-000000000002','S','شوفان','#DFD8C8','QZ-OAT-S',9),
 ('20000000-0000-4000-8000-000000000002','M','شوفان','#DFD8C8','QZ-OAT-M',14),
 ('20000000-0000-4000-8000-000000000002','L','شوفان','#DFD8C8','QZ-OAT-L',11),
 ('20000000-0000-4000-8000-000000000002','XL','شوفان','#DFD8C8','QZ-OAT-XL',6),
 ('20000000-0000-4000-8000-000000000002','M','فحمي','#26282A','QZ-CHR-M',12),
 ('20000000-0000-4000-8000-000000000002','L','فحمي','#26282A','QZ-CHR-L',10),
 ('20000000-0000-4000-8000-000000000003','S','أسود مطفي','#1A1A1A','PF-BLK-S',6),
 ('20000000-0000-4000-8000-000000000003','M','أسود مطفي','#1A1A1A','PF-BLK-M',11),
 ('20000000-0000-4000-8000-000000000003','L','أسود مطفي','#1A1A1A','PF-BLK-L',9),
 ('20000000-0000-4000-8000-000000000003','XL','أسود مطفي','#1A1A1A','PF-BLK-XL',5),
 ('20000000-0000-4000-8000-000000000003','M','زيتي غامق','#1E3B2E','PF-OLV-M',7),
 ('20000000-0000-4000-8000-000000000003','L','زيتي غامق','#1E3B2E','PF-OLV-L',3),
 ('20000000-0000-4000-8000-000000000004','S','جملي','#B48A60','CT-CML-S',4),
 ('20000000-0000-4000-8000-000000000004','M','جملي','#B48A60','CT-CML-M',8),
 ('20000000-0000-4000-8000-000000000004','L','جملي','#B48A60','CT-CML-L',7),
 ('20000000-0000-4000-8000-000000000004','XL','جملي','#B48A60','CT-CML-XL',4),
 ('20000000-0000-4000-8000-000000000005','S','أسود','#1B1B1B','CG-BLK-S',14),
 ('20000000-0000-4000-8000-000000000005','M','أسود','#1B1B1B','CG-BLK-M',20),
 ('20000000-0000-4000-8000-000000000005','L','أسود','#1B1B1B','CG-BLK-L',16),
 ('20000000-0000-4000-8000-000000000005','XL','أسود','#1B1B1B','CG-BLK-XL',9),
 ('20000000-0000-4000-8000-000000000005','M','رمادي حجري','#6D7275','CG-STN-M',11),
 ('20000000-0000-4000-8000-000000000005','L','رمادي حجري','#6D7275','CG-STN-L',10),
 ('20000000-0000-4000-8000-000000000006','S','كريمي','#EFECE4','WF-CRM-S',15),
 ('20000000-0000-4000-8000-000000000006','M','كريمي','#EFECE4','WF-CRM-M',18),
 ('20000000-0000-4000-8000-000000000006','L','كريمي','#EFECE4','WF-CRM-L',14),
 ('20000000-0000-4000-8000-000000000006','XL','كريمي','#EFECE4','WF-CRM-XL',10),
 ('20000000-0000-4000-8000-000000000007','S','كحلي داكن','#1C2B3A','OS-NVY-S',7),
 ('20000000-0000-4000-8000-000000000007','M','كحلي داكن','#1C2B3A','OS-NVY-M',12),
 ('20000000-0000-4000-8000-000000000007','L','كحلي داكن','#1C2B3A','OS-NVY-L',9),
 ('20000000-0000-4000-8000-000000000007','XL','كحلي داكن','#1C2B3A','OS-NVY-XL',5)
on conflict (product_id, size, color_name) do nothing;

-- ============ SEED: QUANTITY DISCOUNT TIERS ============
insert into public.discount_tiers (product_id, min_qty, discount_type, value, is_active) values
 (null, 2, 'percent', 10, true),
 (null, 3, 'percent', 15, true),
 ('20000000-0000-4000-8000-000000000006', 2, 'fixed', 250, true),
 ('20000000-0000-4000-8000-000000000006', 3, 'percent', 20, true)
on conflict do nothing;
