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
      currentProjectId: { type: 'string' },
      currentHost: { type: 'string' },
    },
  },
};
