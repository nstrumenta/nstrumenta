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
    const message = 'Failure to connect to nstrumenta';
    if (err && (err as AxiosError).response) {
      const { data, status } = (err as AxiosError).response!;
      console.log(message, { data, status });
    } else if (err && (err as AxiosError).request) {
      console.log(message, (err as AxiosError).request);
    }
    console.log(message, err);
    throw err;
  }
};

export const verifyToken = async ({
  token,
  apiKey,
}: {
  token: string;
  apiKey: string;
}): Promise<boolean> => {
  const headers = {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
  };
  try {
    await axios.post(
      endpoints.VERIFY_TOKEN,
      { token },
      {
        headers,
      }
    );
    return true;
  } catch (err) {
    const message = 'Failure to connect to nstrumenta';
    if (err && (err as AxiosError).response) {
      const { data, status } = (err as AxiosError).response!;
      console.log(message, { data, status });
    } else if (err && (err as AxiosError).request) {
      console.log(message, (err as AxiosError).request);
    }
    console.log(message, err);
    throw err;
  }
};
