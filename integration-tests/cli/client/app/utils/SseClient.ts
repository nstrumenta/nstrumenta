import EventSource from 'eventsource';

export interface SseWaitOptions {
  timeout?: number;
  filter?: (data: any) => boolean;
}

export class SseClient {
  private eventSource: any | null = null;
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || process.env.NSTRUMENTA_API_URL || 'http://nstrumenta-server:5999';
    this.apiKey = apiKey || process.env.NSTRUMENTA_API_KEY || '';
  }

  async waitForEvent(
    eventType: string,
    matchCondition: (data: any) => boolean,
    options: SseWaitOptions = {}
  ): Promise<any> {
    const { timeout = 60000 } = options;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.close();
        reject(new Error(`Timeout waiting for ${eventType} event after ${timeout}ms`));
      }, timeout);

      this.eventSource = new EventSource(`${this.baseUrl}/mcp/sse`, {
        headers: {
          'x-api-key': this.apiKey,
        },
      } as any);

      this.eventSource.addEventListener(eventType, (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (matchCondition(data)) {
            clearTimeout(timeoutId);
            this.close();
            resolve(data);
          }
        } catch (err) {
          console.error('Error parsing SSE event:', err);
        }
      });

      this.eventSource.onerror = (error) => {
        clearTimeout(timeoutId);
        this.close();
        reject(new Error(`SSE connection error: ${error}`));
      };
    });
  }

  close() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

export async function waitForResourceUpdate(
  uri: string,
  timeout: number = 60000
): Promise<void> {
  const client = new SseClient();
  try {
    await client.waitForEvent(
      'resource_updated',
      (data) => data.uri === uri || data.uri?.includes(uri),
      { timeout }
    );
  } finally {
    client.close();
  }
}
