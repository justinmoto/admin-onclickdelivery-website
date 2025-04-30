CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  store_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stores (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  email TEXT NULL,
  phone_number TEXT NULL,
  logo_url TEXT NOT NULL,
  location TEXT NOT NULL,
  longitude DECIMAL(10,6) NOT NULL,
  latitude DECIMAL(10,6) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  service TEXT NOT NULL,
  customer_name TEXT NULL,
  customer_mobile TEXT NULL,
  customer_address TEXT NULL,
  customer_unit_number TEXT NULL,
  customer_instructions TEXT NULL,
  lat_coordinates DECIMAL(10,6) NULL,
  lng_coordinates DECIMAL(10,6) NULL,
  payment_method TEXT NULL,
  subtotal DECIMAL(10,2) NULL,
  delivery_fee DECIMAL(10,2) NULL,
  total DECIMAL(10,2) NULL,
  status VARCHAR(255) NULL DEFAULT 'pending',
  order_date TIMESTAMP NULL,
  shipday_order_id INTEGER NULL,
  shipday_data JSONB NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  name TEXT NULL,
  price DECIMAL(10,2) NULL,
  quantity INTEGER NULL,
  store_id INTEGER NULL,
  store_name TEXT NULL,
  store_logo TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE menu_photos (
  id SERIAL PRIMARY KEY,
  photo_url TEXT NOT NULL,
  store_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fare_rates (
  id SERIAL PRIMARY KEY,
  base_fare DECIMAL(10,2) NOT NULL,
  rate_per_km DECIMAL(10,2) NOT NULL,
  other_charges DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_orders_service ON orders(service);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_shipday_order_id ON orders(shipday_order_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_menu_items_store_id ON menu_items(store_id);
CREATE INDEX idx_menu_photos_store_id ON menu_photos(store_id);

-- Add foreign key constraints
ALTER TABLE menu_items
ADD CONSTRAINT fk_menu_items_store
FOREIGN KEY (store_id) REFERENCES stores(id)
ON DELETE CASCADE;

ALTER TABLE order_items
ADD CONSTRAINT fk_order_items_order
FOREIGN KEY (order_id) REFERENCES orders(id)
ON DELETE CASCADE;

ALTER TABLE menu_photos
ADD CONSTRAINT fk_menu_photos_store
FOREIGN KEY (store_id) REFERENCES stores(id)
ON DELETE CASCADE;

-- Create trigger function for updating updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    -- Explicitly preserve the original created_at timestamp
    -- Do not modify the created_at field
    NEW.created_at = OLD.created_at;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at
    BEFORE UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_photos_updated_at
    BEFORE UPDATE ON menu_photos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fare_rates_updated_at
    BEFORE UPDATE ON fare_rates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial fare rate
INSERT INTO fare_rates (base_fare, rate_per_km, other_charges) VALUES (40, 10, 0); 