import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProductsProvider } from './contexts/ProductsContext';
import { CartProvider } from './contexts/CartContext';
import { POSRealtimeProvider } from './contexts/POSRealtimeContext';
import { ShiftProvider } from './contexts/ShiftContext';
import { AppShell } from './components/layout/AppShell';
import { NavTab } from './components/navigation/BottomNavigation';
import { POSPage } from './pages/POSPage';
import { ProductsPage } from './pages/ProductsPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuthView } from './components/auth/AuthView';
import { LoadingState } from './components/ui/LoadingState';

const MainAppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('pos');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50 text-gray-800">
        <LoadingState message="پشکنینی چوونەژوورەوەی سیستەم..." />
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return (
    <AppShell activeTab={activeTab} onSelectTab={setActiveTab}>
      {activeTab === 'pos' && <POSPage />}
      {activeTab === 'products' && <ProductsPage />}
      {activeTab === 'expenses' && <ExpensesPage />}
      {activeTab === 'reports' && <ReportsPage />}
    </AppShell>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ProductsProvider>
          <CartProvider>
            <POSRealtimeProvider>
              <ShiftProvider>
                <MainAppContent />
              </ShiftProvider>
            </POSRealtimeProvider>
          </CartProvider>
        </ProductsProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
