import axios from 'axios';
import { endpoints } from '../../cli';

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
