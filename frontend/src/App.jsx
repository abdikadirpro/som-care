import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import ShopLayout from './components/layout/ShopLayout';
import FullPageSpinner from './components/ui/FullPageSpinner';

// Staff pages
const Login      = lazy(() => import('./pages/Login'));
const Dashboard  = lazy(() => import('./pages/Dashboard'));
const POS        = lazy(() => import('./pages/POS'));
const Medicines  = lazy(() => import('./pages/Medicines'));
const StockView  = lazy(() => import('./pages/StockView'));
const Inventory  = lazy(() => import('./pages/Inventory'));
const Suppliers  = lazy(() => import('./pages/Suppliers'));
const Sales      = lazy(() => import('./pages/Sales'));
const Analytics     = lazy(() => import('./pages/Analytics'));
const Users         = lazy(() => import('./pages/Users'));
const Settings      = lazy(() => import('./pages/Settings'));
const OnlineOrders  = lazy(() => import('./pages/OnlineOrders'));

// Public / customer pages
const Landing          = lazy(() => import('./pages/Landing'));
const Shop             = lazy(() => import('./pages/Shop'));
const CustomerRegister = lazy(() => import('./pages/CustomerRegister'));
const MyOrders         = lazy(() => import('./pages/MyOrders'));

const ADMIN_ROLES  = ['SUPER_ADMIN', 'ADMIN'];
const POS_ROLES    = ['SUPER_ADMIN', 'ADMIN', 'PHARMACIST', 'CASHIER'];
const STOCK_ROLES  = ['SUPER_ADMIN', 'ADMIN', 'PHARMACIST'];
const STAFF_ROLES  = ['SUPER_ADMIN', 'ADMIN', 'PHARMACIST', 'CASHIER'];
const ORDER_ROLES  = ['SUPER_ADMIN', 'ADMIN', 'PHARMACIST'];

// Requires auth; optionally restricts by role
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

// Root redirect: staff → dashboard, customer → shop, guest → landing
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!user)                      return <Landing />;
  if (user.role === 'CUSTOMER')   return <Navigate to="/shop" replace />;
  return <Navigate to="/dashboard" replace />;
};

// Shop routes are for guests and customers only — staff go to their dashboard
const CustomerRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (user && STAFF_ROLES.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

export default function App() {
  const { loading } = useAuth();
  if (loading) return <FullPageSpinner />;

  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>

        {/* ── Auth (no layout) ──────────────────────────────────────── */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<CustomerRegister />} />

        {/* ── Public / Customer shop (ShopLayout top-nav) ────────────── */}
        <Route element={<ShopLayout />}>
          <Route path="/"          element={<RootRedirect />} />
          <Route path="/shop"      element={<CustomerRoute><Shop /></CustomerRoute>} />
          <Route path="/my-orders" element={
            <ProtectedRoute roles={['CUSTOMER']}><MyOrders /></ProtectedRoute>
          } />
        </Route>

        {/* ── Staff panel (AppLayout sidebar) ───────────────────────── */}
        <Route element={<ProtectedRoute roles={STAFF_ROLES}><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard"  element={<Dashboard />} />
          <Route path="/pos"        element={<ProtectedRoute roles={POS_ROLES}><POS /></ProtectedRoute>} />
          <Route path="/stock"         element={<ProtectedRoute roles={STOCK_ROLES}><StockView /></ProtectedRoute>} />
          <Route path="/online-orders" element={<ProtectedRoute roles={ORDER_ROLES}><OnlineOrders /></ProtectedRoute>} />
          <Route path="/medicines"  element={<ProtectedRoute roles={ADMIN_ROLES}><Medicines /></ProtectedRoute>} />
          <Route path="/inventory"  element={<ProtectedRoute roles={ADMIN_ROLES}><Inventory /></ProtectedRoute>} />
          <Route path="/sales"      element={<ProtectedRoute roles={ADMIN_ROLES}><Sales /></ProtectedRoute>} />
          <Route path="/suppliers"  element={<ProtectedRoute roles={ADMIN_ROLES}><Suppliers /></ProtectedRoute>} />
          <Route path="/analytics"  element={<ProtectedRoute roles={ADMIN_ROLES}><Analytics /></ProtectedRoute>} />
          <Route path="/users"      element={<ProtectedRoute roles={ADMIN_ROLES}><Users /></ProtectedRoute>} />
          <Route path="/settings"   element={<ProtectedRoute roles={ADMIN_ROLES}><Settings /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
