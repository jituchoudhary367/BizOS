import { createBrowserRouter } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';

// Lazy-load pages for code splitting
import { lazy, Suspense } from 'react';

const LandingPage = lazy(() => import('../pages/landing/LandingPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const OnboardingWizard = lazy(() => import('../pages/auth/OnboardingWizard'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const BrainPage = lazy(() => import('../pages/brain/BrainPage'));
const OrdersPage = lazy(() => import('../pages/orders/OrdersPage'));
const OrderDetailPage = lazy(() => import('../pages/orders/OrderDetailPage'));
const InventoryPage = lazy(() => import('../pages/inventory/InventoryPage'));
const FinancePage = lazy(() => import('../pages/finance/FinancePage'));
const CustomersPage = lazy(() => import('../pages/customers/CustomersPage'));
const CustomerDetailPage = lazy(() => import('../pages/customers/CustomerDetailPage'));
const StaffPage = lazy(() => import('../pages/staff/StaffPage'));
const AnalyticsPage = lazy(() => import('../pages/analytics/AnalyticsPage'));
const AgentsPage = lazy(() => import('../pages/agents/AgentsPage'));
const WhatsAppPage = lazy(() => import('../pages/whatsapp/WhatsAppPage'));
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const withSuspense = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/',
    element: withSuspense(LandingPage),
  },
  {
    path: '/login',
    element: withSuspense(LoginPage),
  },
  {
    path: '/register',
    element: withSuspense(RegisterPage),
  },
  {
    path: '/onboarding',
    element: withSuspense(OnboardingWizard),
  },

  // App routes (within shell)
  {
    path: '/app',
    element: <AppShell />,
    children: [
      {
        path: 'dashboard',
        element: withSuspense(DashboardPage),
      },
      {
        path: 'brain',
        element: withSuspense(BrainPage),
      },
      {
        path: 'orders',
        element: withSuspense(OrdersPage),
      },
      {
        path: 'orders/:id',
        element: withSuspense(OrderDetailPage),
      },
      {
        path: 'inventory',
        element: withSuspense(InventoryPage),
      },
      {
        path: 'finance',
        element: withSuspense(FinancePage),
      },
      {
        path: 'finance/invoices',
        element: withSuspense(FinancePage),
      },
      {
        path: 'finance/ledger',
        element: withSuspense(FinancePage),
      },
      {
        path: 'finance/collections',
        element: withSuspense(FinancePage),
      },
      {
        path: 'customers',
        element: withSuspense(CustomersPage),
      },
      {
        path: 'customers/:id',
        element: withSuspense(CustomerDetailPage),
      },
      {
        path: 'staff',
        element: withSuspense(StaffPage),
      },
      {
        path: 'analytics',
        element: withSuspense(AnalyticsPage),
      },
      {
        path: 'agents',
        element: withSuspense(AgentsPage),
      },
      {
        path: 'whatsapp',
        element: withSuspense(WhatsAppPage),
      },
      {
        path: 'settings',
        element: withSuspense(SettingsPage),
      },
    ],
  },
]);
