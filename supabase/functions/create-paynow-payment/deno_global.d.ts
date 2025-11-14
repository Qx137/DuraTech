declare global {
  interface SubtleCrypto {
    digest(algorithm: string | Algorithm, data: BufferSource): Promise<ArrayBuffer>;
  }

  interface Crypto {
    readonly subtle: SubtleCrypto;
  }

  var crypto: Crypto;

  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
    // optional server helper used by some std versions / runtimes
    serve?: (handler: (req: Request) => Response | Promise<Response>, options?: unknown) => Promise<void> | void;
  };
}

export {};
