import React, { useState, useEffect } from 'react';
import { Return, Sale } from '../types';
import { dataService } from '../services/dataService';

interface ReturnWithSale extends Return {
    sale?: Sale;
}

const Returns: React.FC = () => {
    const [returns, setReturns] = useState<ReturnWithSale[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        sale_id: '',
        reason: '',
        refund_amount: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [returnsData, salesData] = await Promise.all([
            dataService.getReturns(),
            dataService.getSales()
        ]);
        setReturns(returnsData);
        setSales(salesData);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.sale_id || !formData.refund_amount) return;

        await dataService.createReturn({
            sale_id: formData.sale_id,
            reason: formData.reason || undefined,
            refund_amount: parseFloat(formData.refund_amount)
        });

        setFormData({ sale_id: '', reason: '', refund_amount: '' });
        setShowModal(false);
        loadData();
    };

    const handleApprove = async (id: string) => {
        await dataService.approveReturn(id);
        loadData();
    };

    const handleReject = async (id: string) => {
        await dataService.rejectReturn(id);
        loadData();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'REJECTED':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto h-[calc(100vh-64px)] overflow-y-auto">
            {/* Header */}
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Returns & Refunds</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage product returns and process refunds.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center shadow-sm"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Return
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {returns.filter(r => r.status === 'PENDING').length}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Approved</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {returns.filter(r => r.status === 'APPROVED').length}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Refunded</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        ₹{returns.filter(r => r.status === 'APPROVED').reduce((sum, r) => sum + Number(r.refund_amount), 0).toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Returns Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Return Requests</h2>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <svg className="animate-spin h-8 w-8 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                ) : returns.length === 0 ? (
                    <div className="p-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">No return requests</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Sale Info</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Reason</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Refund</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {returns.map((ret) => (
                                    <tr key={ret.id} className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                                            {formatDate(ret.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                                                {ret.sale?.customer_name || 'Walk-in'}
                                            </div>
                                            <div className="text-xs text-slate-500">₹{Number(ret.sale?.total_amount || 0).toFixed(2)}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                                            {ret.reason || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-red-600 dark:text-red-400">
                                            -₹{Number(ret.refund_amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(ret.status)}`}>
                                                {ret.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            {ret.status === 'PENDING' && (
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleApprove(ret.id)}
                                                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(ret.id)}
                                                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* New Return Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Return Request</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Select Sale
                                </label>
                                <select
                                    value={formData.sale_id}
                                    onChange={(e) => setFormData({ ...formData, sale_id: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white py-2 px-3"
                                    required
                                >
                                    <option value="">Choose a sale...</option>
                                    {sales.slice(0, 20).map(sale => (
                                        <option key={sale.id} value={sale.id}>
                                            {sale.customer_name || 'Walk-in'} - ₹{Number(sale.total_amount).toFixed(2)} ({new Date(sale.created_at).toLocaleDateString()})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Refund Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.refund_amount}
                                    onChange={(e) => setFormData({ ...formData, refund_amount: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white py-2 px-3"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Reason (Optional)
                                </label>
                                <textarea
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white py-2 px-3"
                                    rows={3}
                                    placeholder="Reason for return..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-2 px-4 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                                >
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Returns;
