# VEXA Winter Store (Egypt COD E-Commerce + Admin Platform)

Modern winter apparel storefront and admin dashboard built for Egypt with Cash on Delivery, dynamic quantity-tiered discounts, 27 governorates shipping, Framer Motion animations, and Supabase backend.

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your Supabase Project URL and public **Anon** key:
   ```bash
   cp .env.example .env
   ```
3. Run tests and start dev server:
   ```bash
   npm test
   npm run dev
   ```

## Supabase Setup

1. Create a new Supabase project.
2. Open **SQL Editor** and run the full contents of `supabase/schema.sql`. This creates:
   - All tables (`products`, `product_variants`, `product_images`, `discount_tiers`, `governorate_shipping`, `orders`, `order_items`, `order_status_history`, `store_settings`, `admins`)
   - RLS policies & atomic RPCs (`create_guest_order`, `track_order`, `admin_update_order_status`, `admin_delete_product`)
   - Public Storage bucket `products`
   - All 27 Egyptian governorates + 7 editable winter mock products + sample discount tiers
3. In **Authentication -> Providers -> Email**, disable **"Allow new users to sign up"**.
4. In **Authentication -> Users -> Add user**, create your admin account.
5. Grant admin access by running in SQL Editor:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'YOUR_ADMIN_EMAIL';
   ```
6. Add your local and Vercel production/preview URLs under **Authentication -> URL Configuration**.

## Vercel Deployment

1. Import this repository into Vercel (`framework: vite`, build command `npm run build`, output directory `dist`).
2. Add the environment variables from `.env.example` in Vercel Project Settings (Production & Preview).
3. `vercel.json` handles SPA rewrites so `/admin/*`, `/product/*`, and `/track` never 404 on hard refresh.
