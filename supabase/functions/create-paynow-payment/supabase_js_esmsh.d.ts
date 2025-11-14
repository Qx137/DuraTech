// Minimal Supabase typings for different esm.sh specifiers used in the repo
declare module "https://esm.sh/@supabase/supabase-js@2" {
  export interface SupabaseAuth {
    getUser(): Promise<{ data: { user: any | null }; error: any | null }>;
  }
  export interface SupabaseQueryResult { data: any | null; error: any | null; }
  export interface SupabaseFrom {
    select(query?: string): SupabaseFrom;
    eq(column: string, value: any): SupabaseFrom;
    single(): Promise<SupabaseQueryResult>;
    update(values: Record<string, any>): Promise<SupabaseQueryResult>;
    insert(values: Record<string, any> | Record<string, any>[]): Promise<SupabaseQueryResult>;
    delete(): Promise<SupabaseQueryResult>;
  }
  export interface SupabaseClient {
    auth: SupabaseAuth;
    from(table: string): SupabaseFrom;
  }
  export function createClient(url: string, key: string, opts?: any): SupabaseClient;
  export default createClient;
}

declare module "https://esm.sh/@supabase/supabase-js@2.51.0" {
  export * from "https://esm.sh/@supabase/supabase-js@2";
  export { default } from "https://esm.sh/@supabase/supabase-js@2";
}

declare module "https://esm.sh/@supabase/supabase-js" {
  export * from "https://esm.sh/@supabase/supabase-js@2";
  export { default } from "https://esm.sh/@supabase/supabase-js@2";
}
