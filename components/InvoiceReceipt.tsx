import React from 'react';
import { CartItem } from '../types';

interface InvoiceReceiptProps {
  saleId?: string;
  date?: string;
  customerName?: string;
  items: CartItem[];
  subTotal: number;
  discount: number;
  total: number;
}

export const InvoiceReceipt: React.FC<InvoiceReceiptProps> = ({
  saleId,
  date,
  customerName,
  items,
  subTotal,
  discount,
  total,
}) => {
  // Only render if there is data to print
  if (!items || items.length === 0) return null;

  return (
    <div className="hidden print:block print:w-full bg-white text-slate-900 p-8">
      {/* Matches ReceiptPreviewModal layout exactly */}
      <div className="max-w-2xl mx-auto">

        {/* Invoice Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Disni Designs</h1>
            <p className="text-xs text-slate-600 mb-2">Trophy | Flex | Banner | Vinyl | Laser & Cloth Printing</p>
            <div className="text-sm text-slate-500 space-y-0.5">
              <p>Al Rayan Complex Moochikkad, Alathur</p>
              <p>8891410945</p>
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
              {customerName || 'Walk-in Customer'}
            </p>
          </div>
          <div className="text-right">
            <div className="mb-1">
              <span className="text-sm font-bold text-slate-900 mr-2">Receipt #:</span>
              <span className="text-sm text-slate-700">{saleId}</span>
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 mr-2">Receipt Date:</span>
              <span className="text-sm text-slate-700">{date}</span>
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
              {items.map((item, index) => (
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
              <span>₹{subTotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Discount</span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-slate-900 pt-3 border-t border-slate-200">
              <span>TOTAL</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer / Terms */}
        <div className="pt-6 border-t border-slate-100">
          <h4 className="text-sm font-bold text-slate-900 mb-1">Terms & Conditions</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Payment is due immediately. Please make checks payable to: Disni Designs.
            <br />
            Goods once sold cannot be taken back or exchanged.
          </p>
        </div>

      </div>
    </div>
  );
};