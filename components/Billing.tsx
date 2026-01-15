import React, { useState, useEffect, useMemo } from 'react';
import { Product, CartItem } from '../types';
import { dataService } from '../services/dataService';
import { InvoiceReceipt } from './InvoiceReceipt';
import ReceiptPreviewModal from './ReceiptPreviewModal';

const Billing: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isProcessing, setIsProcessing] = useState(false);
  const [discountInput, setDiscountInput] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI'>('CASH');
  const [pricingMode, setPricingMode] = useState<'retail' | 'wholesale'>('retail');
  const [showPreview, setShowPreview] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [recentProductIds, setRecentProductIds] = useState<string[]>(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem('disney_recent_products');
    return saved ? JSON.parse(saved) : [];
  });

  // State for the printed receipt
  const [lastSaleData, setLastSaleData] = useState<{
    id: string;
    date: string;
    customerName: string;
    items: CartItem[];
    subTotal: number;
    discount: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    loadProducts();
  }, [lastSaleData]); // Reload products after sale to update stock

  const loadProducts = async () => {
    const data = await dataService.getProducts();
    setProducts(data);
  };

  // Compute recent products from IDs
  const recentProducts = useMemo(() => {
    return recentProductIds
      .map(id => products.find(p => p.id === id))
      .filter((p): p is Product => p !== undefined)
      .slice(0, 6);
  }, [recentProductIds, products]);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['All', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const addToCart = (product: Product) => {
    if (product.stock_quantity === 0) return;

    // Get the appropriate price based on pricing mode
    // Only use wholesale price if it's actually set (> 0)
    const hasWholesale = product.wholesale_price && product.wholesale_price > 0;
    const activePrice = pricingMode === 'wholesale' && hasWholesale
      ? product.wholesale_price
      : product.price;

    // Trigger animation
    setLastAddedId(product.id);
    setTimeout(() => setLastAddedId(null), 300);

    // Add to recent products
    setRecentProductIds(prev => {
      const updated = [product.id, ...prev.filter(id => id !== product.id)].slice(0, 10);
      localStorage.setItem('disney_recent_products', JSON.stringify(updated));
      return updated;
    });

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) return prev; // Prevent overselling
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      // Add new item with the current pricing mode's price
      return [...prev, { ...product, price: activePrice, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty < 1) return item;
          // Find original product to check stock limit
          const original = products.find(p => p.id === productId);
          if (original && newQty > original.stock_quantity) return item;
          return { ...item, quantity: newQty };
        }
        return item;
      });
    });
  };

  const subTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const discountAmount = parseFloat(discountInput) || 0;
  const finalTotal = Math.max(0, subTotal - discountAmount);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      // 1. Prepare Data - Generate unique Bill ID with date prefix
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-IN').replace(/\//g, '');
      const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const displayId = `BILL-${dateStr}-${timeStr}-${randomSuffix}`;
      const formattedDate = now.toLocaleDateString('en-IN') + " " + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

      // 2. Save to DB
      await dataService.createSale({
        customer_name: customerName,
        total_amount: finalTotal,
        discount_amount: discountAmount,
        payment_method: paymentMethod
      }, cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price
      })));

      // 3. Set Receipt Data for the hidden print component
      setLastSaleData({
        id: displayId,
        date: formattedDate,
        customerName: customerName,
        items: [...cart], // Copy cart
        subTotal: subTotal,
        discount: discountAmount,
        total: finalTotal
      });

      // 4. Open Preview Modal (instead of immediate print)
      setShowPreview(true);

      // 5. Cleanup inputs
      setCart([]);
      setDiscountInput('');
      setCustomerName('');
      setPaymentMethod('CASH');

    } catch (error) {
      console.error("Checkout failed", error);
      alert("Checkout failed: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setLastSaleData(null); // Reset after closing to prevent stale data
  };

  return (
    <>
      {/* Receipt Preview Modal - Shows on screen after checkout */}
      <ReceiptPreviewModal
        isOpen={showPreview}
        onClose={handleClosePreview}
        onPrint={handlePrint}
        data={lastSaleData}
      />

      {/* Hidden Receipt Component - Only Visible in Actual Print Output */}
      {lastSaleData && (
        <InvoiceReceipt
          saleId={lastSaleData.id}
          date={lastSaleData.date}
          customerName={lastSaleData.customerName}
          items={lastSaleData.items}
          subTotal={lastSaleData.subTotal}
          discount={lastSaleData.discount}
          total={lastSaleData.total}
        />
      )}

      {/* Main UI - Hidden in Print */}
      <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden print:hidden">
        {/* LEFT SIDE: Product Selector */}
        <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full overflow-hidden transition-colors duration-200">
          {/* Search & Filter Header */}
          <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm z-10 flex flex-col gap-4 transition-colors duration-200">
            {/* Pricing Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Pricing:</span>
                <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
                  <button
                    onClick={() => { setPricingMode('retail'); setCart([]); }}
                    className={`px-4 py-2 text-sm font-semibold transition-all flex items-center gap-1.5 ${pricingMode === 'retail'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                      }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Retail
                  </button>
                  <button
                    onClick={() => { setPricingMode('wholesale'); setCart([]); }}
                    className={`px-4 py-2 text-sm font-semibold transition-all flex items-center gap-1.5 ${pricingMode === 'wholesale'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                      }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Wholesale
                  </button>
                </div>
              </div>
              {pricingMode === 'wholesale' && (
                <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full animate-pulse">
                  BULK PRICING ACTIVE
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search trophies by name or SKU..."
                className="pl-10 block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border-transparent focus:bg-white dark:focus:bg-slate-600 focus:border-blue-500 focus:ring-0 text-sm py-2.5 px-3 transition-colors shadow-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Recent Products Quick Access */}
          {recentProducts.length > 0 && !searchQuery && (
            <div className="px-4 pt-4 pb-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recently Added
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {recentProducts.map(product => {
                  const hasRecentWholesale = product.wholesale_price && product.wholesale_price > 0;
                  const recentDisplayPrice = pricingMode === 'wholesale' && hasRecentWholesale
                    ? product.wholesale_price
                    : product.price;
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={product.stock_quantity === 0}
                      className={`flex-shrink-0 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border text-left transition-all ${pricingMode === 'wholesale' ? 'border-amber-200 dark:border-amber-700' : 'border-slate-200 dark:border-slate-700'
                        } ${product.stock_quantity > 0
                          ? 'hover:border-blue-400 hover:shadow-sm cursor-pointer'
                          : 'opacity-50 cursor-not-allowed'
                        }`}
                    >
                      <div className="text-xs font-medium text-slate-800 dark:text-white truncate max-w-[120px]">{product.name}</div>
                      <div className={`text-xs font-bold ${pricingMode === 'wholesale' && hasRecentWholesale
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-blue-600 dark:text-blue-400'
                        }`}>₹{recentDisplayPrice}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(product => {
                const inStock = product.stock_quantity > 0;
                const hasWholesalePrice = product.wholesale_price && product.wholesale_price > 0;
                const displayPrice = pricingMode === 'wholesale' && hasWholesalePrice
                  ? product.wholesale_price
                  : product.price;

                return (
                  <div
                    key={product.id}
                    onClick={() => inStock && addToCart(product)}
                    className={`relative group bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border flex flex-col justify-between transition-all duration-200 
                      ${pricingMode === 'wholesale' ? 'border-amber-200 dark:border-amber-800' : 'border-slate-200 dark:border-slate-700'}
                      ${inStock
                        ? 'cursor-pointer hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500 hover:-translate-y-1 active:scale-[0.98]'
                        : 'opacity-75 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50'}`}
                  >
                    <div className="mb-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          {product.sku}
                        </span>
                        {pricingMode === 'wholesale' && hasWholesalePrice && (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400">
                            BULK
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight line-clamp-2 h-10">{product.name}</h3>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex flex-col">
                        <span className={`text-lg font-bold ${pricingMode === 'wholesale' && hasWholesalePrice
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-900 dark:text-white'
                          }`}>
                          ₹{displayPrice.toFixed(2)}
                        </span>
                        {pricingMode === 'wholesale' && hasWholesalePrice && (
                          <span className="text-[10px] text-slate-400 line-through">₹{product.price.toFixed(2)}</span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${inStock ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                        {inStock ? `${product.stock_quantity} Left` : 'Sold Out'}
                      </span>
                    </div>

                    {/* Hover Overlay Effect for Available Items */}
                    {inStock && (
                      <div className="absolute inset-0 bg-blue-600 bg-opacity-0 group-hover:bg-opacity-5 dark:group-hover:bg-opacity-10 rounded-xl transition-all" />
                    )}
                  </div>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <svg className="w-16 h-16 mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="font-medium">No trophies found</p>
                <p className="text-sm">Try adjusting your search</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: Cart */}
        <div className={`w-full md:w-[420px] bg-white dark:bg-slate-800 border-l flex flex-col h-full shadow-2xl z-20 transition-colors duration-200 ${pricingMode === 'wholesale' ? 'border-amber-300 dark:border-amber-700' : 'border-slate-200 dark:border-slate-700'
          }`}>
          <div className={`p-5 border-b transition-colors ${pricingMode === 'wholesale'
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
            }`}>
            <h2 className="font-bold text-xl text-slate-800 dark:text-white flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg mr-3 ${pricingMode === 'wholesale'
                  ? 'bg-amber-100 dark:bg-amber-900/40'
                  : 'bg-blue-100 dark:bg-blue-900/40'
                  }`}>
                  <svg className={`w-5 h-5 ${pricingMode === 'wholesale'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-blue-600 dark:text-blue-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                {pricingMode === 'wholesale' ? 'Wholesale Order' : 'Current Order'}
              </div>
              {pricingMode === 'wholesale' && (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-1 rounded">
                  BULK
                </span>
              )}
            </h2>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-900 transition-colors">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-medium text-slate-600 dark:text-slate-400">Your cart is empty</p>
                  <p className="text-sm">Select trophies to add them here</p>
                </div>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className={`bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center group transition-all hover:shadow-md ${lastAddedId === item.id ? 'animate-pop' : ''}`}>
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-semibold text-slate-800 dark:text-white text-sm truncate">{item.name}</h4>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">₹{item.price.toFixed(2)} / unit</div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="px-3 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 active:bg-slate-300 dark:active:bg-slate-500 transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-slate-800 dark:text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="px-3 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 active:bg-slate-300 dark:active:bg-slate-500 transition-colors"
                      >
                        +
                      </button>
                    </div>

                    {/* Price & Delete */}
                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="font-bold text-slate-900 dark:text-white w-16">₹{(item.price * item.quantity).toFixed(2)}</div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30"
                        title="Remove Item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals & Checkout Footer */}
          <div className="p-6 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-colors">
            <div className="space-y-3 mb-6">

              {/* Customer Name Input */}
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-sm">
                <span>Customer Name</span>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter Name"
                  className="w-40 text-right font-medium text-slate-800 dark:text-white border-b border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:outline-none bg-transparent placeholder-slate-400"
                />
              </div>

              <div className="flex justify-between text-slate-500 dark:text-slate-400 text-sm">
                <span>Subtotal</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">₹{subTotal.toFixed(2)}</span>
              </div>

              {/* Discount Input */}
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-sm">
                <span>Discount</span>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">- ₹</span>
                  <input
                    type="number"
                    min="0"
                    max={subTotal}
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    placeholder="0.00"
                    className="w-20 text-right font-medium text-red-500 border-b border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:outline-none bg-transparent placeholder-slate-300"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-sm">
                <span>Payment</span>
                <div className="flex gap-1">
                  {(['CASH', 'CARD', 'UPI'] as const).map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${paymentMethod === method
                        ? method === 'CASH' ? 'bg-green-600 text-white'
                          : method === 'CARD' ? 'bg-blue-600 text-white'
                            : 'bg-purple-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-dashed border-slate-200 dark:border-slate-700">
                <span className="text-lg font-bold text-slate-800 dark:text-white">Total</span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing}
              className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all transform flex justify-center items-center ${cart.length === 0 || isProcessing
                ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed shadow-none text-slate-100 dark:text-slate-500'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30 active:scale-[0.98]'
                }`}
            >
              {isProcessing ? (
                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2h2m3-4H9a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-1m-1 4l-3 3m0 0l-3-3m3 3V3" />
                  </svg>
                  Print & Save
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Billing;