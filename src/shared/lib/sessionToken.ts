import axios from 'axios';
import { getEndpoints } from '../index';

export const verifyToken = async ({
  token,
  apiKey,
  apiUrl,
}: {
  token: string;
  apiKey: string;
  apiUrl: string;
}): Promise<boolean> => {
  const headers = {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
  };
  try {
    await axios.post(
      getEndpoints(apiUrl).VERIFY_TOKEN,
      { token },
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
