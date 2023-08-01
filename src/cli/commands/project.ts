import axios, { AxiosRequestConfig } from 'axios';
import { endpoints, resolveApiKey } from '../utils';

export const Info = async () => {
  const apiKey = resolveApiKey();

  const config: AxiosRequestConfig = {
    method: 'post',
    headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
  };
  let response = await axios(endpoints.GET_PROJECT, config);

  console.log(response.data);
};

export const Name = async () => {
  const apiKey = resolveApiKey();

  const config: AxiosRequestConfig = {
    method: 'post',
    headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
  };
  let response = await axios(endpoints.GET_PROJECT, config);

  console.log(response.data.name);
};
