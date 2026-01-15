<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Disni Designs POS System

A modern Point of Sale system for Disni Designs Trophy & Gifts shop.

## Features

- **Billing** - Fast product selection with search and category filters
- **Wholesale/Retail Pricing** - Toggle between retail and wholesale pricing modes
- **Inventory Management** - Add, edit, and delete products with stock tracking
- **Sales Reports** - View transaction history with export options
- **Dashboard** - Real-time analytics and low-stock alerts
- **Receipt Generation** - Professional printable receipts
- **Dark Mode** - Automatic dark/light theme support

## New: Wholesale Pricing

The system now supports dual pricing:
- **Retail Mode** (Blue) - Standard customer pricing
- **Wholesale Mode** (Amber) - Bulk/dealer pricing

Switch modes using the toggle in the Billing page. Cart clears when switching to prevent price mixing.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables in `.env.local`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   ```

3. Run the SQL in `schema.sql` in your Supabase SQL Editor

4. Start the app:
   ```bash
   npm run dev
   ```

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase (Database)
- Chart.js (Analytics)
