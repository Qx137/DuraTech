declare module "https://deno.land/std@0.177.0/http/server.ts" {
  export type ServeHandler = (req: Request) => Response | Promise<Response>;
  export function serve(handler: ServeHandler, options?: unknown): Promise<void>;
}

declare module "https://deno.land/std@0.190.0/http/server.ts" {
  export type ServeHandler = (req: Request) => Response | Promise<Response>;
  export function serve(handler: ServeHandler, options?: unknown): Promise<void>;
}
