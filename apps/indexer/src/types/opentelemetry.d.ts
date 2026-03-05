declare module "@opentelemetry/sdk-node" {
  export class NodeSDK {
    constructor(options: unknown);
    start(): Promise<void>;
    shutdown(): Promise<void>;
  }
}

declare module "@opentelemetry/auto-instrumentations-node" {
  export function getNodeAutoInstrumentations(): unknown;
}

declare module "@opentelemetry/exporter-trace-otlp-http" {
  export class OTLPTraceExporter {
    constructor(options: unknown);
  }
}
