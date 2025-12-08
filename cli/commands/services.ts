import { endpoints, resolveApiKey } from '../utils';
import { SetAction } from './module';

export interface Service {
  name: string;
}

export const GetServices = async () => {
  const apiKey = resolveApiKey();
  const options = {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  };
  const response = await (await fetch(endpoints.GET_CLOUD_RUN_SERVICES, options)).json();
  return response;
};

export const ListServices = async () => {
  try {
    const response = await GetServices();
    console.log(response);
  } catch (error) {
    console.error(error);
  }
};

export const StartService = async (
  image: string,
  options: { containerCommand: string; containerPort: string }
): Promise<void> => {
  const {containerCommand, containerPort} = options;
  const action = JSON.stringify({
    task: 'startCloudRunService',
    status: 'pending',
    data: { image, command: containerCommand, port: containerPort },
  });

  SetAction({ action });
};
