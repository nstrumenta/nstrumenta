import { McpClient } from '../mcp';

export const Info = async () => {
  const mcp = new McpClient();
  const { project } = await mcp.getProject();
  console.log(project);
};

export const ProjectId = async () => {
  const mcp = new McpClient();
  const { project } = await mcp.getProject();
  console.log(project.id);
};
