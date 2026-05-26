// ═══════════════════════════════════════════════════════════
// BizOS — Constants
// ═══════════════════════════════════════════════════════════

export const APP_NAME = 'BizOS';
export const APP_TAGLINE = 'Run your business in plain language.';

// Navigation items
export const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'LayoutDashboard', path: '/app/dashboard' },
  { label: 'AI Brain', icon: 'Sparkles', path: '/app/brain', glow: true },
  { label: 'Orders', icon: 'ShoppingCart', path: '/app/orders', badge: 'orders' },
  { label: 'Inventory', icon: 'Package', path: '/app/inventory', badge: 'inventory' },
  { label: 'Finance', icon: 'IndianRupee', path: '/app/finance', badge: 'finance' },
  { label: 'Customers', icon: 'Users', path: '/app/customers' },
  { label: 'Staff', icon: 'IdCard', path: '/app/staff' },
  { label: 'Analytics', icon: 'BarChart3', path: '/app/analytics' },
  { divider: true },
  { label: 'Agent control', icon: 'Bot', path: '/app/agents' },
  { label: 'Settings', icon: 'Settings', path: '/app/settings' },
];

// Business types for onboarding
export const BUSINESS_TYPES = [
  { value: 'wholesale', label: 'Wholesale distributor' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'restaurant', label: 'Restaurant / food business' },
  { value: 'hardware', label: 'Hardware store' },
  { value: 'garment', label: 'Garment / textile trader' },
  { value: 'electronics', label: 'Electronics shop' },
  { value: 'fmcg', label: 'FMCG distributor' },
  { value: 'other', label: 'Other' },
];

// Order sources
export const ORDER_SOURCES = [
  { value: 'whatsapp', label: 'WhatsApp', color: 'text-success' },
  { value: 'manual', label: 'Manual', color: 'text-brand-400' },
  { value: 'api', label: 'API', color: 'text-text-secondary' },
  { value: 'voice', label: 'Voice', color: 'text-warning' },
];

// Order statuses
export const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

// Invoice statuses
export const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

// AI Brain suggested prompts
export const BRAIN_SUGGESTIONS = [
  { text: "Who hasn't paid in 30 days?", icon: 'AlertCircle' },
  { text: 'Which products are running low?', icon: 'Package' },
  { text: "Show today's profit", icon: 'TrendingUp' },
  { text: 'Generate invoice for Amit Traders', icon: 'FileText' },
  { text: 'What sold most this week?', icon: 'BarChart3' },
  { text: 'Call suppliers for delayed stock', icon: 'Phone' },
  { text: 'How many pending deliveries?', icon: 'Truck' },
  { text: "Summarize today's orders", icon: 'ClipboardList' },
];

// Payment methods
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'razorpay', label: 'Razorpay' },
];

// Product units
export const PRODUCT_UNITS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'piece', label: 'Piece' },
  { value: 'litre', label: 'Litre (L)' },
  { value: 'box', label: 'Box' },
  { value: 'pack', label: 'Pack' },
  { value: 'metre', label: 'Metre (m)' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'bag', label: 'Bag' },
];

// GST rates
export const GST_RATES = [0, 5, 12, 18, 28];

// Pricing plans
export const PRICING_PLANS = [
  {
    name: 'Starter',
    price: 999,
    annual: 799,
    features: [
      'Up to 100 orders/month',
      'WhatsApp order parsing',
      'Basic inventory tracking',
      'GST invoicing',
      '1 user',
      'Email support',
    ],
  },
  {
    name: 'Growth',
    price: 4999,
    annual: 3999,
    popular: true,
    features: [
      'Unlimited orders',
      'WhatsApp + voice orders',
      'AI demand forecasting',
      'Collections agent',
      'Staff management',
      'Analytics dashboard',
      '5 users',
      'Priority support',
    ],
  },
  {
    name: 'Enterprise',
    price: null,
    annual: null,
    features: [
      'Everything in Growth',
      'Custom AI agents',
      'Multi-warehouse',
      'API access',
      'Dedicated account manager',
      'Custom integrations',
      'Unlimited users',
      'SLA guarantee',
    ],
  },
];

// Demo data for frontend when Supabase is not connected
export const DEMO_METRICS = {
  todayRevenue: 147200,
  yesterdayRevenue: 132800,
  pendingOrders: 4,
  lowStockAlerts: 3,
  overdueCollections: 289640,
};
