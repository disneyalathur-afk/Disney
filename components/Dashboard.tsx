import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { dataService } from '../services/dataService';
import { Product } from '../types';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface DashboardStats {
    todayRevenue: number;
    todaySalesCount: number;
    weekRevenue: number;
    weekSalesCount: number;
    monthRevenue: number;
    monthSalesCount: number;
    lowStockCount: number;
    lowStockProducts: Product[];
    totalProducts: number;
}

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [salesChart, setSalesChart] = useState<{ labels: string[]; data: number[] } | null>(null);
    const [categoryChart, setCategoryChart] = useState<{ labels: string[]; counts: number[]; values: number[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        const [statsData, chartData, catData] = await Promise.all([
            dataService.getDashboardStats(),
            dataService.getSalesChartData(7),
            dataService.getCategoryStats()
        ]);
        setStats(statsData);
        setSalesChart(chartData);
        setCategoryChart(catData);
        setLoading(false);
    };

    const isDark = document.documentElement.classList.contains('dark');

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx: any) => `₹${ctx.parsed.y.toFixed(2)}`
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: isDark ? '#94a3b8' : '#64748b' }
            },
            y: {
                grid: { color: isDark ? '#334155' : '#e2e8f0' },
                ticks: {
                    color: isDark ? '#94a3b8' : '#64748b',
                    callback: (value: any) => `₹${value}`
                }
            }
        }
    };

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: isDark ? '#94a3b8' : '#64748b' }
            },
            y: {
                grid: { color: isDark ? '#334155' : '#e2e8f0' },
                ticks: { color: isDark ? '#94a3b8' : '#64748b' }
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                <div className="text-center">
                    <svg className="animate-spin h-12 w-12 mx-auto text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-slate-500 dark:text-slate-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const exportDailySummary = () => {
        const today = new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const summaryContent = `
DISNEY TROPHY & GIFTS
DAILY SUMMARY REPORT
═══════════════════════════════════════

Date: ${today}
Generated: ${new Date().toLocaleTimeString('en-IN')}

═══════════════════════════════════════
SALES OVERVIEW
═══════════════════════════════════════

Today's Revenue:     ₹${stats?.todayRevenue.toFixed(2) || '0.00'}
Today's Sales:       ${stats?.todaySalesCount || 0} transactions

This Week:           ₹${stats?.weekRevenue.toFixed(2) || '0.00'}
Week Sales:          ${stats?.weekSalesCount || 0} transactions

This Month:          ₹${stats?.monthRevenue.toFixed(2) || '0.00'}
Month Sales:         ${stats?.monthSalesCount || 0} transactions

═══════════════════════════════════════
INVENTORY STATUS
═══════════════════════════════════════

Total Products:      ${stats?.totalProducts || 0}
Low Stock Items:     ${stats?.lowStockCount || 0}

${stats?.lowStockProducts && stats.lowStockProducts.length > 0 ?
                `LOW STOCK ALERT:
${stats.lowStockProducts.map(p => `  • ${p.name} (${p.stock_quantity} left)`).join('\n')}`
                : 'All products well-stocked ✓'}

═══════════════════════════════════════
        `.trim();

        // Create and download text file
        const blob = new Blob([summaryContent], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `daily-summary-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto h-[calc(100vh-64px)] overflow-y-auto">
            {/* Header */}
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400">Welcome back! Here's your business overview.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={exportDailySummary}
                        className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center shadow-sm"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Daily Report
                    </button>
                    <button
                        onClick={async () => {
                            const backup = await dataService.exportAllData();
                            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `disney-pos-backup-${new Date().toISOString().split('T')[0]}.json`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                        }}
                        className="px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center shadow-sm"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Backup
                    </button>
                    <button
                        onClick={loadDashboardData}
                        className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Today's Revenue */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Today's Revenue</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">₹{stats?.todayRevenue.toFixed(2)}</p>
                            <p className="text-xs text-slate-400 mt-1">{stats?.todaySalesCount} sales</p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Week Revenue */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">This Week</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{stats?.weekRevenue.toFixed(2)}</p>
                            <p className="text-xs text-slate-400 mt-1">{stats?.weekSalesCount} sales</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Month Revenue */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">This Month</p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">₹{stats?.monthRevenue.toFixed(2)}</p>
                            <p className="text-xs text-slate-400 mt-1">{stats?.monthSalesCount} sales</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Low Stock Alert */}
                <div className={`rounded-xl shadow-sm border p-5 ${stats?.lowStockCount && stats.lowStockCount > 0
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Low Stock Items</p>
                            <p className={`text-2xl font-bold ${stats?.lowStockCount && stats.lowStockCount > 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-slate-900 dark:text-white'
                                }`}>{stats?.lowStockCount}</p>
                            <p className="text-xs text-slate-400 mt-1">of {stats?.totalProducts} products</p>
                        </div>
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stats?.lowStockCount && stats.lowStockCount > 0
                            ? 'bg-red-100 dark:bg-red-900/50'
                            : 'bg-slate-100 dark:bg-slate-700'
                            }`}>
                            <svg className={`w-6 h-6 ${stats?.lowStockCount && stats.lowStockCount > 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-slate-600 dark:text-slate-400'
                                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Sales Trend Chart */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                        Sales Trend (Last 7 Days)
                    </h3>
                    <div className="h-64">
                        {salesChart && (
                            <Line
                                data={{
                                    labels: salesChart.labels,
                                    datasets: [{
                                        data: salesChart.data,
                                        borderColor: '#3b82f6',
                                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                        fill: true,
                                        tension: 0.4,
                                        pointBackgroundColor: '#3b82f6',
                                        pointBorderColor: '#fff',
                                        pointBorderWidth: 2,
                                        pointRadius: 4
                                    }]
                                }}
                                options={lineChartOptions as any}
                            />
                        )}
                    </div>
                </div>

                {/* Category Distribution Chart */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                        Products by Category
                    </h3>
                    <div className="h-64">
                        {categoryChart && (
                            <Bar
                                data={{
                                    labels: categoryChart.labels,
                                    datasets: [{
                                        data: categoryChart.counts,
                                        backgroundColor: [
                                            'rgba(59, 130, 246, 0.8)',
                                            'rgba(16, 185, 129, 0.8)',
                                            'rgba(139, 92, 246, 0.8)',
                                            'rgba(245, 158, 11, 0.8)',
                                            'rgba(239, 68, 68, 0.8)',
                                            'rgba(236, 72, 153, 0.8)'
                                        ],
                                        borderRadius: 6
                                    }]
                                }}
                                options={barChartOptions as any}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Low Stock Products List */}
            {stats?.lowStockProducts && stats.lowStockProducts.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Low Stock Alert
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stats.lowStockProducts.map(product => (
                            <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white text-sm">{product.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{product.sku}</p>
                                </div>
                                <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs font-bold rounded-full">
                                    {product.stock_quantity} left
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
