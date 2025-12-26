import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import { dataService } from '../services/dataService';

const Navbar: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  const { isAdmin } = useAuth();

  useEffect(() => {
    // Sync state with DOM on mount
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }
  }, []);

  // Fetch low stock count for admin
  useEffect(() => {
    if (isAdmin) {
      const fetchLowStock = async () => {
        const stats = await dataService.getDashboardStats();
        setLowStockCount(stats.lowStockCount);
      };
      fetchLowStock();
      // Refresh every 30 seconds
      const interval = setInterval(fetchLowStock, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  const getLinkClass = (isActive: boolean) =>
    `flex items-center px-4 py-2 rounded-md transition-colors font-medium text-sm ${isActive
      ? 'bg-blue-600 text-white shadow-sm'
      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
    }`;

  return (
    <>
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 print:hidden transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white block leading-tight">Disni Designs</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 block -mt-0.5">powered by <span className="font-medium text-blue-500">AstriOrb</span></span>
                </div>
              </div>

              {/* Desktop Nav */}
              <nav className="hidden sm:ml-10 sm:flex sm:space-x-4">
                <NavLink to="/" className={({ isActive }) => getLinkClass(isActive)}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Billing
                </NavLink>

                {/* Admin-only links */}
                {isAdmin && (
                  <>
                    <NavLink to="/dashboard" className={({ isActive }) => getLinkClass(isActive)}>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                      Dashboard
                    </NavLink>
                    <NavLink to="/inventory" className={({ isActive }) => getLinkClass(isActive)}>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      Inventory
                      {lowStockCount > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full animate-pulse">
                          {lowStockCount}
                        </span>
                      )}
                    </NavLink>

                    <NavLink to="/sales" className={({ isActive }) => getLinkClass(isActive)}>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Sales
                    </NavLink>

                    <NavLink to="/returns" className={({ isActive }) => getLinkClass(isActive)}>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                      </svg>
                      Returns
                    </NavLink>
                  </>
                )}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-yellow-300 transition-colors focus:outline-none"
                title="Toggle Dark Mode"
              >
                {isDark ? (
                  /* Sun Icon */
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  /* Moon Icon */
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  {isAdmin ? 'Admin' : 'Guest'}
                </span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {isAdmin ? 'Logged In' : 'Click to Login'}
                </span>
              </div>

              {/* User Icon - Click to show login modal */}
              <button
                onClick={() => setShowLoginModal(true)}
                className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${isAdmin
                  ? 'bg-green-100 dark:bg-green-900/40 border-2 border-green-500 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/60'
                  : 'bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                title={isAdmin ? 'Admin Panel' : 'Login as Admin'}
              >
                {isAdmin ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ) : (
                  'A'
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;