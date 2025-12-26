import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Billing from './components/Billing';
import Inventory from './components/Inventory';
import SalesReport from './components/SalesReport';
import Dashboard from './components/Dashboard';
import Returns from './components/Returns';
import SplashScreen from './components/SplashScreen';
import BillingPasswordModal from './components/BillingPasswordModal';

// Protected Route component (for Admin features)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isBillingUnlocked, setIsBillingUnlocked] = useState(() => {
    // Check if already authenticated in this session
    return sessionStorage.getItem('disney_billing_auth') === 'true';
  });

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // After splash, show password modal if not unlocked
  if (!isBillingUnlocked) {
    return (
      <BillingPasswordModal
        isOpen={true}
        onSuccess={() => setIsBillingUnlocked(true)}
      />
    );
  }

  // Main app content
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <Navbar />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Billing />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/inventory" element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            } />
            <Route path="/sales" element={
              <ProtectedRoute>
                <SalesReport />
              </ProtectedRoute>
            } />
            <Route path="/returns" element={
              <ProtectedRoute>
                <Returns />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;