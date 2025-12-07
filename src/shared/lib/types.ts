import { Mcap0Types } from '@mcap/core';

export interface LogConfig {
  header: Mcap0Types.Header;
  channels: Array<{
    schema: { title: string; type: 'object'; properties: Record<string, unknown> };
    channel: Omit<Mcap0Types.Channel, 'id' | 'schemaId' | 'metadata'>;
  }>;
}
