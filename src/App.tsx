import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { CartProvider } from './contexts/CartContext';
import { AppShell } from './components/layout/AppShell';
import { NavTab } from './components/navigation/BottomNavigation';
import { POSPage } from './pages/POSPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuthView } from './components/auth/AuthView';
import { LoadingState } from './components/ui/LoadingState';

const MainAppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('pos');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
        <LoadingState message="پشکنینی چوونەژوورەوەی سیستەم..." className="text-white" />
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return (
    <AppShell activeTab={activeTab} onSelectTab={setActiveTab}>
      {activeTab === 'pos' && <POSPage />}
      {activeTab === 'expenses' && <ExpensesPage />}
      {activeTab === 'reports' && <ReportsPage />}
    </AppShell>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <MainAppContent />
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
