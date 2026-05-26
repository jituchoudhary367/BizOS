// ═══════════════════════════════════════════════════════════
// BizOS — Formatters & Utilities
// ═══════════════════════════════════════════════════════════

/**
 * Format currency in INR
 */
export function formatCurrency(amount, options = {}) {
  const { compact = false, showSign = false } = options;

  if (amount === null || amount === undefined) return '₹0';

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: compact ? 0 : 2,
    ...(compact && Math.abs(amount) >= 100000 ? { notation: 'compact' } : {}),
  });

  const formatted = formatter.format(Math.abs(amount));
  if (showSign && amount > 0) return `+${formatted}`;
  if (amount < 0) return `-${formatted}`;
  return formatted;
}

/**
 * Format number with Indian numbering system
 */
export function formatNumber(num, options = {}) {
  const { compact = false } = options;
  if (num === null || num === undefined) return '0';

  return new Intl.NumberFormat('en-IN', {
    ...(compact ? { notation: 'compact' } : {}),
  }).format(num);
}

/**
 * Format date relative to now
 */
export function formatRelativeDate(date) {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * Format date as DD MMM YYYY
 */
export function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format date as DD MMM YYYY, HH:MM
 */
export function formatDateTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format phone number for display
 */
export function formatPhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Get initials from name
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Calculate percentage change
 */
export function percentChange(current, previous) {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Truncate text
 */
export function truncate(text, length = 50) {
  if (!text || text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Get status color class
 */
export function getStatusColor(status) {
  const colors = {
    // Order statuses
    pending: 'badge-warning',
    confirmed: 'badge-info',
    processing: 'badge-info',
    dispatched: 'badge-info',
    delivered: 'badge-success',
    cancelled: 'badge-danger',
    // Invoice statuses
    draft: 'badge-neutral',
    sent: 'badge-info',
    paid: 'badge-success',
    overdue: 'badge-danger',
    // Task statuses
    todo: 'badge-neutral',
    in_progress: 'badge-info',
    done: 'badge-success',
    // Attendance
    present: 'badge-success',
    absent: 'badge-danger',
    late: 'badge-warning',
    half_day: 'badge-warning',
    // Agent
    active: 'badge-success',
    idle: 'badge-neutral',
    running: 'badge-info',
    error: 'badge-danger',
  };
  return colors[status] || 'badge-neutral';
}

/**
 * Get risk score color
 */
export function getRiskColor(score) {
  if (score >= 0.7) return 'text-danger';
  if (score >= 0.4) return 'text-warning';
  return 'text-success';
}

/**
 * Generate order number
 */
export function generateOrderNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${year}-${random}`;
}
