import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { dataService } from '../services/dataService';

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);

  // State for Add Product Form
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    cost_price: '',
    stock_quantity: ''
  });

  // State for Inline Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ price: string; stock_quantity: string }>({
    price: '',
    stock_quantity: ''
  });

  // State for Delete Confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await dataService.getProducts();
    setProducts(data);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;

    setIsDeleting(true);
    await dataService.deleteProduct(deleteConfirmId);
    setIsDeleting(false);
    setDeleteConfirmId(null);
    loadProducts();
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.stock_quantity) return;

    // Generate unique SKU: Category prefix + timestamp + random alphanumeric
    const categoryPrefix = (formData.category || 'GEN').substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    const autoSku = `${categoryPrefix}-${timestamp}-${randomSuffix}`;

    await dataService.addProduct({
      name: formData.name,
      sku: autoSku,
      category: formData.category || 'General',
      price: parseFloat(formData.price),
      cost_price: formData.cost_price ? parseFloat(formData.cost_price) : 0,
      stock_quantity: parseInt(formData.stock_quantity)
    });

    setFormData({ name: '', category: '', price: '', cost_price: '', stock_quantity: '' });
    loadProducts();
  };

  const startEditing = (product: Product) => {
    setEditingId(product.id);
    setEditValues({
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString()
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({ price: '', stock_quantity: '' });
  };

  const saveEdit = async (id: string) => {
    await dataService.updateProduct(id, {
      price: parseFloat(editValues.price),
      stock_quantity: parseInt(editValues.stock_quantity)
    });
    setEditingId(null);
    loadProducts();
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto h-[calc(100vh-64px)] overflow-y-auto print:hidden">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Inventory Management</h1>
        <p className="text-slate-500 dark:text-slate-400">Add new trophies and manage existing stock levels.</p>
      </div>

      {/* Low Stock Warning Banner */}
      {products.filter(p => p.stock_quantity < 5).length > 0 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-800 dark:text-red-300 mb-1">Low Stock Alert</h3>
            <p className="text-sm text-red-600 dark:text-red-400 mb-2">
              {products.filter(p => p.stock_quantity < 5).length} product(s) running low on stock:
            </p>
            <div className="flex flex-wrap gap-2">
              {products.filter(p => p.stock_quantity < 5).map(p => (
                <span key={p.id} className="px-2 py-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-medium rounded-full">
                  {p.name} ({p.stock_quantity} left)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Product Form */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8 transition-colors">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Trophy
        </h2>
        <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Trophy Name</label>
            <input
              type="text"
              required
              className="w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white sm:text-sm px-3 py-2 border"
              placeholder="e.g. Gold Cricket Cup"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          {/* SKU is auto-generated based on category */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type (Category)</label>
            <input
              type="text"
              className="w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white sm:text-sm px-3 py-2 border"
              placeholder="e.g. Metal, Crystal, Sports"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Price (₹)</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              className="w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white sm:text-sm px-3 py-2 border"
              placeholder="0.00"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cost Price (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white sm:text-sm px-3 py-2 border"
              placeholder="For profit tracking"
              value={formData.cost_price}
              onChange={e => setFormData({ ...formData, cost_price: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Initial Stock</label>
            <input
              type="number"
              required
              min="0"
              className="w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white sm:text-sm px-3 py-2 border"
              placeholder="0"
              value={formData.stock_quantity}
              onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })}
            />
          </div>
          <div className="md:col-span-1">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition-colors flex justify-center"
            >
              Add
            </button>
          </div>
        </form>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Product Info</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Price (₹)</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Stock</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {products.map((product) => {
                const isEditing = editingId === product.id;
                const isLowStock = product.stock_quantity < 5;

                return (
                  <tr
                    key={product.id}
                    className={`transition-colors ${isEditing
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : isLowStock
                        ? 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30'
                        : 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700'
                      }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{product.name}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{product.sku}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600 dark:text-slate-300">{product.category}</span>
                    </td>

                    {/* Price Column */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          className="w-24 text-right rounded border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm py-1 px-2 border"
                          value={editValues.price}
                          onChange={(e) => setEditValues({ ...editValues, price: e.target.value })}
                        />
                      ) : (
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">₹{product.price.toFixed(2)}</span>
                      )}
                    </td>

                    {/* Stock Column */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          className="w-20 text-right rounded border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm py-1 px-2 border"
                          value={editValues.stock_quantity}
                          onChange={(e) => setEditValues({ ...editValues, stock_quantity: e.target.value })}
                        />
                      ) : (
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isLowStock
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                          }`}>
                          {product.stock_quantity} units
                        </span>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isEditing ? (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => saveEdit(product.id)}
                            className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md text-xs transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600 px-3 py-1 rounded-md text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => startEditing(product)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-medium"
                          >
                            Edit
                          </button>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <button
                            onClick={() => setDeleteConfirmId(product.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No products found in inventory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transition-colors animate-fade-in">
            <div className="p-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">
                Delete Product?
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
                This action cannot be undone. The product will be permanently removed from your inventory.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-3 px-4 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  {isDeleting ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;