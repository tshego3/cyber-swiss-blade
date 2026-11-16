declare module 'cloudflare:sockets' {
  interface SocketAddress {
    readonly hostname: string;
    readonly port: number;
  }

  interface SocketOptions {
    readonly secureTransport?: 'off' | 'on' | 'starttls';
    readonly allowHalfOpen?: boolean;
  }

  interface Socket {
    readonly readable: ReadableStream<Uint8Array>;
    readonly writable: WritableStream<Uint8Array>;
    readonly closed: Promise<void>;
    close(): Promise<void>;
  }

  export function connect(address: SocketAddress, options?: SocketOptions): Socket;
}
