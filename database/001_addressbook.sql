CREATE SEQUENCE IF NOT EXISTS address_book_customer_number_seq START 1;

ALTER TABLE address_book
  ADD COLUMN IF NOT EXISTS customer_number TEXT,
  ADD COLUMN IF NOT EXISTS types TEXT[] NOT NULL DEFAULT ARRAY['other']::TEXT[],
  ADD COLUMN IF NOT EXISTS billing_street TEXT,
  ADD COLUMN IF NOT EXISTS billing_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS billing_city TEXT,
  ADD COLUMN IF NOT EXISTS billing_country TEXT NOT NULL DEFAULT 'Deutschland',
  ADD COLUMN IF NOT EXISTS delivery_same_as_billing BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS delivery_street TEXT,
  ADD COLUMN IF NOT EXISTS delivery_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS delivery_city TEXT,
  ADD COLUMN IF NOT EXISTS delivery_country TEXT NOT NULL DEFAULT 'Deutschland',
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS created_by_clerk_user_id TEXT,
  ADD COLUMN IF NOT EXISTS updated_by_clerk_user_id TEXT;

UPDATE address_book
SET customer_number = 'EH-' || LPAD(nextval('address_book_customer_number_seq')::TEXT, 5, '0')
WHERE customer_number IS NULL;

ALTER TABLE address_book
  ALTER COLUMN customer_number SET DEFAULT ('EH-' || LPAD(nextval('address_book_customer_number_seq')::TEXT, 5, '0')),
  ALTER COLUMN customer_number SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS address_book_customer_number_unique ON address_book(customer_number);

UPDATE address_book
SET types = ARRAY[type]::TEXT[]
WHERE type IS NOT NULL
  AND (types = ARRAY['other']::TEXT[] OR cardinality(types) = 0);
