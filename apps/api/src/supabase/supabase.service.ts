import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  constructor(private readonly supabase: SupabaseClient) {}

  getClient() {
    return this.supabase;
  }
}
