import axios, { AxiosRequestConfig } from 'axios';
import { getEndpoints } from '../../shared';
import { resolveApiKey } from '../utils';

const endpoints = getEndpoints(process.env.NSTRUMENTA_API_URL);

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
