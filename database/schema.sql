-- Llapi Fert PostgreSQL schema. Run against Neon using psql or the Neon SQL editor.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL,
  image_url text NOT NULL,
  price numeric(12,2) CHECK (price IS NULL OR price >= 0),
  price_label text NOT NULL DEFAULT 'Kërko ofertë',
  featured boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL CHECK (length(customer_name) BETWEEN 2 AND 120),
  phone text NOT NULL CHECK (length(phone) BETWEEN 6 AND 40),
  email text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0 AND quantity <= 100000),
  specifications jsonb NOT NULL DEFAULT '{}'::jsonb,
  unit_price numeric(12,2) CHECK (unit_price IS NULL OR unit_price >= 0),
  line_total numeric(12,2) CHECK (line_total IS NULL OR line_total >= 0),
  UNIQUE(order_id, product_id)
);
-- Safe to re-run for databases initialized with an earlier version of this schema.
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS specifications jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_price numeric(12,2) CHECK (unit_price IS NULL OR unit_price >= 0);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS line_total numeric(12,2) CHECK (line_total IS NULL OR line_total >= 0);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category_id);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);

-- Demonstration data only. No real customer information or credentials.
INSERT INTO categories(name,slug,description) VALUES
 ('Fertraj për shtëpi','fertraj','Fertraj betoni për mbështetje dhe mbyllje të ndërtesave.'),
 ('Gypa betoni','gypa-betoni','Gypa betoni për ndërtim dhe hapje bunarësh.'),
 ('Shtylla betoni','shtylla-betoni','Shtylla betoni për projekte të ndryshme ndërtimi.')
ON CONFLICT(slug) DO NOTHING;
INSERT INTO products(category_id,name,slug,description,image_url,price,price_label,featured)
SELECT c.id,v.name,v.slug,v.description,v.image_url,NULL,'Kërko ofertë',v.featured FROM (VALUES
 ('Fertraj për shtëpi','Fertraj për Shtëpi','fertraj-per-shtepi','Fertraj të betonit për shtëpi me cilësi të garantuar. Të përdorur për mbështetje strukturore dhe mbyllje të ndërtesave me siguri maksimale.','/images/fertraj.jpg',true),
 ('Gypa betoni','Gypa Betoni','gypa-betoni','Gypat betoni të cilësisë së lartë për projekte ndërtimi të ndryshme dhe hapje të bunarve. Të prodhuar me materiale cilësore për qëndrueshmëri maksimale.','/images/gypa-betoni.jpg',true),
 ('Shtylla betoni','Shtylla Betoni','shtylla-betoni','Shtylla betoni të cilësisë së lartë për projekte ndërtimi të ndryshme. Të prodhuar me materiale cilësore për qëndrueshmëri maksimale dhe rezistencë afatgjatë.','/images/stuba-betoni.jpg',true)
) AS v(category_slug,name,slug,description,image_url,featured) JOIN categories c ON c.slug=v.category_slug
ON CONFLICT(slug) DO NOTHING;

-- Informative starting prices; exact totals are calculated from product dimensions in the quote form.
UPDATE products SET price_label='Nga 2,00 €/m sipas gjatësisë' WHERE slug='fertraj-per-shtepi';
UPDATE products SET price_label='20–50 € / copë sipas dimensionit' WHERE slug='gypa-betoni';
UPDATE products SET price_label='4–5 € / copë sipas gjatësisë' WHERE slug='shtylla-betoni';
