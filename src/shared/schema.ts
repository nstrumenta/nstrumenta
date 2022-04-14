export const schema = {
  keys: {
    type: 'object',
  },
  current: {
    type: 'string',
  },
  contexts: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      projectId: { type: 'string' },
      wsHost: { type: 'string' },
      channel: { type: 'string' },
    },
  },
};
