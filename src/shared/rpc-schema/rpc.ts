import { OpenrpcDocument } from '@open-rpc/meta-schema';

export const OpenRPCDoc: OpenrpcDocument = {
  openrpc: '1.2.6',
  info: {
    version: '0.0.1',
    title: 'Nstrumenta Agent',
    license: {
      name: 'MIT',
    },
  },
  servers: [
    {
      url: 'ws://*:8088',
    },
  ],
  methods: [
    {
      name: 'startLog',
      summary: 'Start recording agent log in storage',
      tags: [
        {
          name: 'log',
        },
      ],
      params: [],
      result: {
        name: 'path',
        description: 'Path in stroage to the started log',
        schema: {
          $ref: '#/components/schemas/LogId',
        },
      },
      errors: [
        {
          code: 10,
          message: 'pets busy',
        },
      ],
      examples: [
        {
          name: 'listPetExample',
          description: 'List pet example',
          params: [
            {
              name: 'limit',
              value: 1,
            },
          ],
          result: {
            name: 'listPetResultExample',
            value: [
              {
                id: 7,
                name: 'fluffy',
                tag: 'poodle',
              },
            ],
          },
        },
      ],
    },
  ],
  components: {
    contentDescriptors: {
      LogId: {
        name: 'logId',
        required: false,
        description: 'The id of the log',
        schema: {
          $ref: '#/components/schemas/LogId',
        },
      },
    },
    schemas: {
      LogId: {
        type: 'string',
        minimum: 0,
      },
    },
  },
};
