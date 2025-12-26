import React from 'react';
import { CartItem } from '../types';

interface ReceiptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
  data: {
    id: string;
    date: string;
    customerName: string;
    items: CartItem[];
    subTotal: number;
    discount: number;
    total: number;
  } | null;
}

const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({ isOpen, onClose, onPrint, data }) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 print:hidden animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden transition-colors">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Receipt</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">A summary of your transaction. You can print this receipt.</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body - The Receipt Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
          <div className="bg-white text-slate-900 p-8 shadow-sm border border-slate-200 mx-auto max-w-2xl min-h-[500px] flex flex-col">
            
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Disney</h1>
                <div className="text-sm text-slate-500 space-y-0.5">
                  <p>123 Victory Lane, Champion City</p>
                  <p>555-0101</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-4xl font-bold text-slate-200 uppercase tracking-widest">RECEIPT</h2>
              </div>
            </div>

            {/* Bill To & Details */}
            <div className="flex justify-between mb-8">
              <div>
                <h3 className="text-sm font-bold uppercase text-slate-900 mb-1">Bill To</h3>
                <p className="text-lg text-slate-700 capitalize">
                  {data.customerName || 'Walk-in Customer'}
                </p>
              </div>
              <div className="text-right">
                <div className="mb-1">
                  <span className="text-sm font-bold text-slate-900 mr-2">Receipt #:</span>
                  <span className="text-sm text-slate-700">{data.id}</span>
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 mr-2">Receipt Date:</span>
                  <span className="text-sm text-slate-700">{data.date}</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200">
                    <th className="py-2 pl-2 text-xs font-bold text-slate-900 uppercase">Qty</th>
                    <th className="py-2 text-xs font-bold text-slate-900 uppercase w-1/2">Description</th>
                    <th className="py-2 text-right text-xs font-bold text-slate-900 uppercase">Unit Price</th>
                    <th className="py-2 pr-2 text-right text-xs font-bold text-slate-900 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((item, index) => (
                    <tr key={`${item.id}-${index}`}>
                      <td className="py-3 pl-2 text-sm text-slate-700">{item.quantity}</td>
                      <td className="py-3 text-sm text-slate-700 font-medium">{item.name}</td>
                      <td className="py-3 text-right text-sm text-slate-700">₹{item.price.toFixed(2)}</td>
                      <td className="py-3 pr-2 text-right text-sm text-slate-900 font-bold">₹{(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end mb-12">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>₹{data.subTotal.toFixed(2)}</span>
                </div>
                {data.discount > 0 && (
                   <div className="flex justify-between text-sm text-red-600">
                    <span>Discount</span>
                    <span>-₹{data.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-slate-900 pt-3 border-t border-slate-200">
                  <span>TOTAL</span>
                  <span>₹{data.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer / Terms */}
            <div className="mt-auto pt-6 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 mb-1">Terms & Conditions</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Payment is due immediately. Please make checks payable to: Disney Retail.
                <br />
                Goods once sold cannot be taken back or exchanged.
              </p>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
          <button 
            onClick={onPrint}
            className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-transform active:scale-95"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreviewModal;