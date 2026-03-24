import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Goals from './pages/Goals';
import Insights from './pages/Insights';
import Settings from './pages/Settings';

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-100%', opacity: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--bg-primary)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48,
          border: '3px solid var(--border)',
          borderTop: '3px solid var(--accent)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px',
        }} />
        <div style={{ color: 'var(--text-muted)' }}>Loading BudgetWise...</div>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

// This component will render the sidebar and main content for protected routes
function AppLayout() {
  const location = useLocation();
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ overflowX: 'hidden' }}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
            <Route path="/transactions" element={<PageTransition><Transactions /></PageTransition>} />
            <Route path="/budgets" element={<PageTransition><Budgets /></PageTransition>} />
            <Route path="/goals" element={<PageTransition><Goals /></PageTransition>} />
            <Route path="/insights" element={<PageTransition><Insights /></PageTransition>} />
            <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

function MainRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        <Route path="/*" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        } />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontSize: '0.9rem',
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#000' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#000' } },
          }}
        />
        <MainRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
