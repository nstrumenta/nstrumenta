import { McpClient } from '../mcp';

export interface Machine {
  name: string;
  status: string;
  createdAt: string;
  downloadUrl: string;
  serverStatus: string;
  sandboxes: string[];
  url: string;
  wsUrl: string;
}

export const GetMachines = async () => {
  try {
    const mcp = new McpClient();
    const { machines } = await mcp.getMachines();
    return machines as Array<Machine>;
  } catch (error) {
    console.error(`Something went wrong: ${(error as Error).message}`);
    return [];
  }
};

export const ListMachines = async () => {
  try {
    const machines = await GetMachines();
    console.log(machines);
  } catch (error) {
    console.error(error);
  }
};
