import { Injectable } from '@nestjs/common';

@Injectable()
export class ProxyService {
  private readonly serviceMap: Record<string, string> = {
    // Order management
    orders: process.env.ORDER_SERVICE_URL || 'http://localhost:3001',
    // Inventory management
    inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:3002',
    products: process.env.INVENTORY_SERVICE_URL || 'http://localhost:3002',
    // Finance & invoicing
    finance: process.env.FINANCE_SERVICE_URL || 'http://localhost:3003',
    invoices: process.env.FINANCE_SERVICE_URL || 'http://localhost:3003',
    payments: process.env.FINANCE_SERVICE_URL || 'http://localhost:3003',
    ledger: process.env.FINANCE_SERVICE_URL || 'http://localhost:3003',
    cashflow: process.env.FINANCE_SERVICE_URL || 'http://localhost:3003',
    collections: process.env.FINANCE_SERVICE_URL || 'http://localhost:3003',
    // Staff management
    staff: process.env.STAFF_SERVICE_URL || 'http://localhost:3004',
    attendance: process.env.STAFF_SERVICE_URL || 'http://localhost:3004',
    tasks: process.env.STAFF_SERVICE_URL || 'http://localhost:3004',
    // Notifications
    notifications: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005',
    // WhatsApp
    whatsapp: process.env.WHATSAPP_SERVICE_URL || 'http://localhost:3006',
    // AI / Brain
    brain: process.env.AI_SERVICE_URL || 'http://localhost:8000',
    ai: process.env.AI_SERVICE_URL || 'http://localhost:8000',
    agents: process.env.AI_SERVICE_URL || 'http://localhost:8000',
    insights: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  };

  async forward(
    service: string,
    path: string,
    method: string,
    data?: any,
    headers?: Record<string, string>,
    query?: Record<string, string>,
  ): Promise<any> {
    const baseUrl = this.serviceMap[service];
    if (!baseUrl) {
      throw Object.assign(new Error(`Unknown service: ${service}`), { response: { status: 404 } });
    }

    // Build URL with query params
    const url = new URL(`${baseUrl}${path}`);
    if (query) {
      Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const init: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (data && !['GET', 'HEAD', 'DELETE'].includes(method)) {
      init.body = JSON.stringify(data);
    }

    const response = await fetch(url.toString(), init);
    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      const err = Object.assign(
        new Error(responseData?.error || responseData?.message || `Service error ${response.status}`),
        { response: { status: response.status } },
      );
      throw err;
    }

    return responseData;
  }
}
