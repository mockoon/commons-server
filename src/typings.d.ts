// extend Express' Request type
declare namespace Express {
  export interface Request {
    proxied: boolean;
    rawBody: Buffer;
    parsedBody: any;
  }
  export interface Response {
    body: any;
    routeUUID: string;
    routeResponseUUID: string;
  }
}

declare module 'http' {
  export interface Server {
    kill: (callback: () => void) => void;
  }
  export interface IncomingMessage {
    proxied: boolean;
    rawBody: Buffer;
    parsedBody: any;
  }
  export interface ServerResponse {
    body: any;
    routeUUID: string;
    routeResponseUUID: string;
  }
}

declare module 'https' {
  export interface Server {
    kill: (callback: () => void) => void;
  }
}
