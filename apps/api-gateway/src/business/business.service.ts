import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class BusinessService {
  private supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  async getBusinessIdForUser(userId: string): Promise<string | null> {
    const { data } = await this.supabase
      .from('profiles')
      .select('business_id')
      .eq('id', userId)
      .single();
    return data?.business_id || null;
  }

  async getBusinessById(businessId: string) {
    const { data } = await this.supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();
    return data;
  }
}
