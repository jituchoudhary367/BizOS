import { Controller, All, Req, Res, UseGuards, Param } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { ProxyService } from './proxy.service';

@Controller(':service')
@UseGuards(AuthGuard)
export class ProxyController {
  constructor(private proxyService: ProxyService) {}

  @All('*')
  async proxyAll(
    @Param('service') service: string,
    @Req() req: Request & { user?: any; businessId?: string; token?: string },
    @Res() res: Response,
  ) {
    // Strip the /:service prefix to get the downstream path
    // e.g. /api/orders/123 → proxy to order-service at /orders/123
    const fullPath = req.path;
    const servicePrefix = `/${service}`;
    const downstreamPath = fullPath.startsWith(servicePrefix)
      ? fullPath.slice(servicePrefix.length) || '/'
      : fullPath;

    const authHeader = req.headers.authorization
      ? { Authorization: req.headers.authorization as string }
      : {};

    // Forward query params
    const query = req.query as Record<string, string>;

    try {
      const data = await this.proxyService.forward(
        service,
        `/${service}${downstreamPath}`,
        req.method,
        req.body,
        authHeader,
        query,
      );
      res.json(data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json({
        error: error.message,
        service,
      });
    }
  }
}
