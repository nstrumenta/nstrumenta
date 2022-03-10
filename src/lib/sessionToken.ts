import axios, { AxiosError } from 'axios';
import { endpoints } from '../shared';

export const getToken = async (apiKey: string): Promise<string> => {
  const headers = {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
  };
  try {
    const { data } = await axios.get<{ token: string }>(endpoints.GET_TOKEN, {
      headers,
    });
    return data.token;
  } catch (err) {
    const message = 'Problem getting token';
    console.log(message);
    throw err;
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
