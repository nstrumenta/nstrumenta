import axios from 'axios';
import { endpoints } from '../../cli';

export const getToken = async (apiKey: string): Promise<string> => {
  const headers = {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
  };
  try {
    // https://stackoverflow.com/questions/69169492/async-external-function-leaves-open-handles-jest-supertest-express
    if (typeof process === 'object') await process.nextTick(() => {});
    const { data } = await axios.get<{ token: string }>(endpoints.GET_TOKEN, {
      headers,
    });
    return data.token;
  } catch (err) {
    const message = `Problem getting token, check api key, err: ${(err as Error).message}`;
    throw new Error(message);
  }
};

export const verifyToken = async ({
  token,
  apiKey,
  allowCrossProjectApiKey,
}: {
  token: string;
  apiKey: string;
  allowCrossProjectApiKey: boolean;
}): Promise<boolean> => {
  const headers = {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
  };
  try {
    await axios.post(
      endpoints.VERIFY_TOKEN,
      { token, allowCrossProjectApiKey },
      {
        headers,
      }
    );
    return true;
  } catch (err) {
    const message = 'Failed to verify token';
    console.log(message);
    throw err;
  }
};
