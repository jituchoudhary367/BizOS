import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  private services = {
    'order-service': process.env.ORDER_SERVICE_URL || 'http://localhost:3001',
    'inventory-service': process.env.INVENTORY_SERVICE_URL || 'http://localhost:3002',
    'finance-service': process.env.FINANCE_SERVICE_URL || 'http://localhost:3003',
    'staff-service': process.env.STAFF_SERVICE_URL || 'http://localhost:3004',
    'notification-service': process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005',
    'ai-service': process.env.AI_SERVICE_URL || 'http://localhost:8000',
  };

  @Get()
  async health() {
    const checks = await Promise.allSettled(
      Object.entries(this.services).map(async ([name, url]) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        try {
          const res = await fetch(`${url}/health`, { signal: controller.signal });
          clearTimeout(timeout);
          return { name, status: res.ok ? 'up' : 'degraded', url };
        } catch {
          clearTimeout(timeout);
          return { name, status: 'down', url };
        }
      })
    );

    const services = checks.map(r => (r.status === 'fulfilled' ? r.value : { name: 'unknown', status: 'down' }));
    const allUp = services.every(s => s.status === 'up');

    return {
      status: allUp ? 'ok' : 'degraded',
      gateway: 'up',
      services,
      timestamp: new Date().toISOString(),
    };
  }
}
