import { endpoints, resolveApiKey } from '../utils';

export const Info = async () => {
  const apiKey = resolveApiKey();

  const response = await fetch(endpoints.GET_PROJECT, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'content-type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  console.log(data);
};

export const ProjectId = async () => {
  const apiKey = resolveApiKey();

  const response = await fetch(endpoints.GET_PROJECT, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'content-type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = (await response.json()) as { id: string };
  console.log(data.id);
};
