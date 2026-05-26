import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class AuthGuard implements CanActivate {
  private supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  );

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const { data: { user }, error } = await this.supabase.auth.getUser(token);
      if (error || !user) throw new UnauthorizedException('Invalid token');

      request.user = user;
      request.token = token;

      const { data: profile } = await this.supabase
        .from('profiles')
        .select('business_id, role')
        .eq('id', user.id)
        .single();

      if (profile) {
        request.businessId = profile.business_id;
        request.userRole = profile.role;
      }

      return true;
    } catch (e: any) {
      throw new UnauthorizedException(e.message);
    }
  }

  private extractToken(request: any): string | null {
    const auth = request.headers.authorization;
    if (auth?.startsWith('Bearer ')) return auth.slice(7);
    return null;
  }
}
