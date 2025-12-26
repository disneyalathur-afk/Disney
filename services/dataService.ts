import { supabase } from './supabaseClient';
import { Product, Sale, SaleItem, Customer, Return, StockPurchase } from '../types';

// Initial seed data for first-time setup
const INITIAL_PRODUCTS: Omit<Product, 'id'>[] = [
  { name: 'Golden Cricket Championship Cup (Large)', price: 1250.00, stock_quantity: 20, sku: 'TRP-CKT-001', category: 'Sports' },
  { name: 'Crystal Star Excellence Award', price: 850.00, stock_quantity: 15, sku: 'TRP-CRP-002', category: 'Corporate' },
  { name: 'Wooden Plaque - Best Employee', price: 450.00, stock_quantity: 50, sku: 'TRP-WDN-003', category: 'Wooden' },
  { name: 'Silver Football Runner Up Cup', price: 950.00, stock_quantity: 10, sku: 'TRP-FBL-004', category: 'Sports' },
  { name: 'Academic Achievement Shield', price: 350.00, stock_quantity: 100, sku: 'TRP-ACD-005', category: 'Academic' },
  { name: 'Fiber Gold Star Trophy', price: 150.00, stock_quantity: 200, sku: 'TRP-FIB-006', category: 'Fiber' },
  { name: 'Brass Medals (Set of 3)', price: 275.00, stock_quantity: 60, sku: 'MDL-BRS-007', category: 'Medals' },
  { name: 'Glass Momentum with Box', price: 600.00, stock_quantity: 30, sku: 'TRP-GLS-008', category: 'Corporate' },
];

export const dataService = {
  // --- Products ---
  getProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data || [];
  },

  addProduct: async (product: Omit<Product, 'id'>): Promise<Product | null> => {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();

    if (error) {
      console.error('Error adding product:', error);
      return null;
    }

    return data;
  },

  updateProduct: async (id: string, updates: Partial<Product>): Promise<Product | null> => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return null;
    }

    return data;
  },

  deleteProduct: async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return false;
    }

    return true;
  },

  // --- Sales ---
  createSale: async (
    saleData: Omit<Sale, 'id' | 'created_at'>,
    items: { productId: string; quantity: number; price: number }[]
  ): Promise<boolean> => {
    // 1. Create Sale Record
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert([saleData])
      .select()
      .single();

    if (saleError || !sale) {
      console.error('Error creating sale:', saleError);
      return false;
    }

    // 2. Create Sale Items
    const saleItems = items.map(item => ({
      sale_id: sale.id,
      product_id: item.productId,
      quantity: item.quantity,
      price_at_sale: item.price
    }));

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems);

    if (itemsError) {
      console.error('Error creating sale items:', itemsError);
      return false;
    }

    // 3. Update Stock for each product
    for (const item of items) {
      const { error: stockError } = await supabase.rpc('decrement_stock', {
        product_id: item.productId,
        quantity: item.quantity
      });

      // Fallback if RPC doesn't exist - do manual update
      if (stockError) {
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.productId)
          .single();

        if (product) {
          await supabase
            .from('products')
            .update({ stock_quantity: product.stock_quantity - item.quantity })
            .eq('id', item.productId);
        }
      }
    }

    return true;
  },

  // --- Seed Data ---
  seedProducts: async (): Promise<boolean> => {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    // Only seed if no products exist
    if (existing && existing.length > 0) {
      console.log('Products already exist, skipping seed');
      return true;
    }

    const { error } = await supabase
      .from('products')
      .insert(INITIAL_PRODUCTS);

    if (error) {
      console.error('Error seeding products:', error);
      return false;
    }

    console.log('Successfully seeded products');
    return true;
  },

  // --- Sales Reports ---
  getSales: async (): Promise<Sale[]> => {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sales:', error);
      return [];
    }

    return data || [];
  },

  getSalesWithItems: async (): Promise<(Sale & { items: any[] })[]> => {
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (salesError || !sales) {
      console.error('Error fetching sales:', salesError);
      return [];
    }

    // Fetch items for each sale with product details
    const salesWithItems = await Promise.all(
      sales.map(async (sale) => {
        const { data: items } = await supabase
          .from('sale_items')
          .select(`
            *,
            products:product_id (name, sku)
          `)
          .eq('sale_id', sale.id);

        return {
          ...sale,
          items: items || []
        };
      })
    );

    return salesWithItems;
  },

  getSalesSummary: async (startDate?: string, endDate?: string) => {
    let query = supabase
      .from('sales')
      .select('*');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: sales, error } = await query;

    if (error || !sales) {
      console.error('Error fetching sales summary:', error);
      return {
        totalSales: 0,
        totalRevenue: 0,
        totalDiscount: 0,
        averageOrderValue: 0
      };
    }

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
    const totalDiscount = sales.reduce((sum, sale) => sum + Number(sale.discount_amount || 0), 0);
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    return {
      totalSales,
      totalRevenue,
      totalDiscount,
      averageOrderValue
    };
  },

  // --- Dashboard Analytics ---
  getDashboardStats: async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Today's sales
    const { data: todaySales } = await supabase
      .from('sales')
      .select('total_amount')
      .gte('created_at', todayISO);

    // This week's sales (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: weekSales } = await supabase
      .from('sales')
      .select('total_amount, created_at')
      .gte('created_at', weekAgo.toISOString());

    // This month's sales
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const { data: monthSales } = await supabase
      .from('sales')
      .select('total_amount')
      .gte('created_at', monthStart.toISOString());

    // Low stock products
    const { data: lowStock } = await supabase
      .from('products')
      .select('*')
      .lt('stock_quantity', 5);

    // Total products
    const { data: allProducts } = await supabase
      .from('products')
      .select('id');

    return {
      todayRevenue: todaySales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0,
      todaySalesCount: todaySales?.length || 0,
      weekRevenue: weekSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0,
      weekSalesCount: weekSales?.length || 0,
      monthRevenue: monthSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0,
      monthSalesCount: monthSales?.length || 0,
      lowStockCount: lowStock?.length || 0,
      lowStockProducts: lowStock || [],
      totalProducts: allProducts?.length || 0
    };
  },

  getSalesChartData: async (days: number = 7) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const { data: sales } = await supabase
      .from('sales')
      .select('total_amount, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // Group by date
    const dailyData: Record<string, number> = {};
    const labels: string[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = 0;
      labels.push(date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }));
    }

    sales?.forEach(sale => {
      const dateStr = sale.created_at.split('T')[0];
      if (dailyData[dateStr] !== undefined) {
        dailyData[dateStr] += Number(sale.total_amount);
      }
    });

    return {
      labels,
      data: Object.values(dailyData)
    };
  },

  getCategoryStats: async () => {
    const { data: products } = await supabase
      .from('products')
      .select('category, stock_quantity, price');

    const categoryData: Record<string, { count: number; value: number }> = {};

    products?.forEach(product => {
      if (!categoryData[product.category]) {
        categoryData[product.category] = { count: 0, value: 0 };
      }
      categoryData[product.category].count += 1;
      categoryData[product.category].value += product.stock_quantity * Number(product.price);
    });

    return {
      labels: Object.keys(categoryData),
      counts: Object.values(categoryData).map(c => c.count),
      values: Object.values(categoryData).map(c => c.value)
    };
  },

  // --- Customers ---
  getCustomers: async (): Promise<Customer[]> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching customers:', error);
      return [];
    }

    return data || [];
  },

  searchCustomers: async (query: string): Promise<Customer[]> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('name', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Error searching customers:', error);
      return [];
    }

    return data || [];
  },

  addCustomer: async (customer: Omit<Customer, 'id' | 'total_purchases' | 'visit_count' | 'created_at' | 'updated_at'>): Promise<Customer | null> => {
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
      .select()
      .single();

    if (error) {
      console.error('Error adding customer:', error);
      return null;
    }

    return data;
  },

  updateCustomerStats: async (customerId: string, purchaseAmount: number): Promise<boolean> => {
    const { data: customer } = await supabase
      .from('customers')
      .select('total_purchases, visit_count')
      .eq('id', customerId)
      .single();

    if (!customer) return false;

    const { error } = await supabase
      .from('customers')
      .update({
        total_purchases: Number(customer.total_purchases) + purchaseAmount,
        visit_count: customer.visit_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId);

    return !error;
  },

  deleteCustomer: async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting customer:', error);
      return false;
    }

    return true;
  },

  // --- Returns/Refunds ---
  getReturns: async (): Promise<(Return & { sale?: Sale })[]> => {
    const { data, error } = await supabase
      .from('returns')
      .select(`
        *,
        sale:sales(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching returns:', error);
      return [];
    }

    return data || [];
  },

  createReturn: async (returnData: Omit<Return, 'id' | 'status' | 'created_at'>): Promise<Return | null> => {
    const { data, error } = await supabase
      .from('returns')
      .insert([{ ...returnData, status: 'PENDING' }])
      .select()
      .single();

    if (error) {
      console.error('Error creating return:', error);
      return null;
    }

    return data;
  },

  approveReturn: async (returnId: string): Promise<boolean> => {
    // Get the return details first
    const { data: returnData } = await supabase
      .from('returns')
      .select('*')
      .eq('id', returnId)
      .single();

    if (!returnData) return false;

    // Update status to approved
    const { error } = await supabase
      .from('returns')
      .update({ status: 'APPROVED' })
      .eq('id', returnId);

    return !error;
  },

  rejectReturn: async (returnId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('returns')
      .update({ status: 'REJECTED' })
      .eq('id', returnId);

    return !error;
  },

  // --- Stock Purchases ---
  addStockPurchase: async (purchase: Omit<StockPurchase, 'id' | 'created_at'>): Promise<StockPurchase | null> => {
    // 1. Add stock purchase record
    const { data, error } = await supabase
      .from('stock_purchases')
      .insert([purchase])
      .select()
      .single();

    if (error) {
      console.error('Error adding stock purchase:', error);
      return null;
    }

    // 2. Update product stock quantity
    const { data: product } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', purchase.product_id)
      .single();

    if (product) {
      await supabase
        .from('products')
        .update({
          stock_quantity: product.stock_quantity + purchase.quantity,
          cost_price: purchase.unit_cost,
          updated_at: new Date().toISOString()
        })
        .eq('id', purchase.product_id);
    }

    return data;
  },

  getStockPurchases: async (productId?: string): Promise<StockPurchase[]> => {
    let query = supabase
      .from('stock_purchases')
      .select('*')
      .order('created_at', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching stock purchases:', error);
      return [];
    }

    return data || [];
  },

  // --- Profit Stats ---
  getProfitStats: async () => {
    const { data: products } = await supabase
      .from('products')
      .select('id, name, price, cost_price, stock_quantity');

    const { data: salesItems } = await supabase
      .from('sale_items')
      .select(`
        quantity,
        price_at_sale,
        products:product_id (cost_price)
      `);

    let totalRevenue = 0;
    let totalCost = 0;

    salesItems?.forEach((item: any) => {
      const revenue = item.quantity * Number(item.price_at_sale);
      const cost = item.quantity * (Number(item.products?.cost_price) || 0);
      totalRevenue += revenue;
      totalCost += cost;
    });

    const productMargins = products?.map(p => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      cost_price: Number(p.cost_price) || 0,
      margin: Number(p.price) - (Number(p.cost_price) || 0),
      margin_percent: p.cost_price ? ((Number(p.price) - Number(p.cost_price)) / Number(p.price) * 100) : 0,
      stock_quantity: p.stock_quantity
    })) || [];

    return {
      totalRevenue,
      totalCost,
      grossProfit: totalRevenue - totalCost,
      profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100) : 0,
      productMargins
    };
  },

  // --- Backup & Restore ---
  exportAllData: async () => {
    const [products, sales, saleItems, customers, returns, stockPurchases] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('sales').select('*'),
      supabase.from('sale_items').select('*'),
      supabase.from('customers').select('*'),
      supabase.from('returns').select('*'),
      supabase.from('stock_purchases').select('*')
    ]);

    return {
      exportDate: new Date().toISOString(),
      data: {
        products: products.data || [],
        sales: sales.data || [],
        sale_items: saleItems.data || [],
        customers: customers.data || [],
        returns: returns.data || [],
        stock_purchases: stockPurchases.data || []
      }
    };
  }
};