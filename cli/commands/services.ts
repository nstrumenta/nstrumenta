import { McpClient } from '../mcp';

export interface Service {
  name: string;
}

export const GetServices = async () => {
  const mcp = new McpClient();
  const { services } = await mcp.getCloudRunServices();
  return services;
};

export const ListServices = async () => {
  try {
    const services = await GetServices();
    console.log(services);
  } catch (error) {
    console.error(error);
  }
};


