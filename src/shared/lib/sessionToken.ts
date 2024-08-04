import { getEndpoints } from '../index';

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
    const response = await fetch(getEndpoints(apiKey).VERIFY_TOKEN, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (err) {
    const message = 'Failed to verify token';
    console.log(message);
    throw err;
  }
};
