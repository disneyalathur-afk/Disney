-- Disney POS Database Schema for Supabase
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2) DEFAULT 0,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    sku TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add cost_price column if table already exists (for existing databases)
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10, 2) DEFAULT 0;

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    total_purchases DECIMAL(10, 2) DEFAULT 0,
    visit_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    customer_name TEXT,
    total_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    payment_method TEXT CHECK(payment_method IN ('CASH', 'CARD', 'UPI')) DEFAULT 'CASH'
);

-- Sale items table
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price_at_sale DECIMAL(10, 2) NOT NULL
);

-- Returns/Refunds table
CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id),
    reason TEXT,
    refund_amount DECIMAL(10, 2) NOT NULL,
    status TEXT CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Purchases table (track when stock is added)
CREATE TABLE IF NOT EXISTS stock_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL,
    supplier TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);

-- Function to decrement stock
CREATE OR REPLACE FUNCTION decrement_stock(product_id UUID, quantity INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE products
    SET stock_quantity = stock_quantity - quantity,
        updated_at = NOW()
    WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for development)
-- Products: Allow all operations (drop if exists, then create)
DROP POLICY IF EXISTS "Allow all on products" ON products;
CREATE POLICY "Allow all on products" ON products
    FOR ALL USING (true) WITH CHECK (true);

-- Sales: Allow all operations
DROP POLICY IF EXISTS "Allow all on sales" ON sales;
CREATE POLICY "Allow all on sales" ON sales
    FOR ALL USING (true) WITH CHECK (true);

-- Sale Items: Allow all operations
DROP POLICY IF EXISTS "Allow all on sale_items" ON sale_items;
CREATE POLICY "Allow all on sale_items" ON sale_items
    FOR ALL USING (true) WITH CHECK (true);

-- Customers: Enable RLS and Allow all operations
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on customers" ON customers;
CREATE POLICY "Allow all on customers" ON customers
    FOR ALL USING (true) WITH CHECK (true);

-- Returns: Enable RLS and Allow all operations
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on returns" ON returns;
CREATE POLICY "Allow all on returns" ON returns
    FOR ALL USING (true) WITH CHECK (true);

-- Stock Purchases: Enable RLS and Allow all operations
ALTER TABLE stock_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on stock_purchases" ON stock_purchases;
CREATE POLICY "Allow all on stock_purchases" ON stock_purchases
    FOR ALL USING (true) WITH CHECK (true);

-- Schema setup complete!
-- Database starts empty - add products through the app interface.
