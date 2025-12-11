import { createWriteStream } from 'fs';
import { access, mkdir, readFile, stat } from 'fs/promises';
import { pipeline as streamPipeline } from 'stream';
import { promisify } from 'util';
import { QueryOptions } from '../../lib';
import { McpClient } from '../mcp';
import ErrnoException = NodeJS.ErrnoException;

const pipeline = promisify(streamPipeline);

export interface ModuleMeta {
  filePath: string;
  name: string;
  size: number; // make sure we're actually getting a number, not a string
  lastModified: number; // make sure we're actually getting a number, not a string
}

export interface DataListOptions {}

export const List = async (_: unknown, options: DataListOptions) => {
  try {
    const mcp = new McpClient();
    const { objects } = await mcp.listData();
    console.log(JSON.stringify(objects, undefined, 2));
  } catch (err) {
    console.error('Error:', (err as Error).message);
  }
};



export const Upload = async (
  filenames: string[],
  { tags, overwrite }: { tags?: string[]; overwrite?: boolean }
) => {
  if (filenames.length === 0) {
    return console.log('Please specify at least one filename');
  }

  try {
    for (const file of filenames) {
      await stat(file);
    }
  } catch (error) {
    if ((error as ErrnoException).code === 'ENOENT') {
      console.warn(`Request canceled: ${(error as ErrnoException).path} does not exist`);
      return;
    }
    throw error;
  }

  let results = [];

  for (const filename of filenames) {
    try {
      console.log('upload', { filename, tags });
      const response = await uploadFile({ filename, tags, overwrite });
      results.push(response);
    } catch (error) {
      console.log(`Error uploading ${filename}: ${(error as Error).message}`);
      throw error;
    }
  }

  console.log(results);
};

interface UploadResponse {
  filename: string;
  remoteFilePath: string;
}

export const uploadFile = async ({
  filename,
  dataId,
  tags,
  overwrite,
}: {
  filename: string;
  dataId?: string;
  tags?: string[];
  overwrite?: boolean;
}): Promise<UploadResponse> => {
  let fileBuffer;
  let size;
  let url;
  let remoteFilePath: string = '';

  fileBuffer = await readFile(filename);
  size = fileBuffer.length;
  const name = filename.split('/').pop();

  try {
    const mcp = new McpClient();
    const result = await mcp.getUploadDataUrl(
      name || filename,
      overwrite || false
    );
    
    url = result.uploadUrl;
    remoteFilePath = result.filePath;

    const putConfig = {
      method: 'PUT',
      body: fileBuffer,
    };

    const response = await fetch(url, putConfig);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (err) {
    console.error('Error:', (err as Error).message);
    throw err;
  }

  return { filename, remoteFilePath };
};

export const query = async ({
  field,
  comparison,
  compareValue,
  limit,
  collection,
}: QueryOptions): Promise<Array<Record<string, unknown>>> => {
  if (!collection) {
    throw new Error('collection parameter is required');
  }
  if (!field) {
    throw new Error('field parameter is required');
  }
  try {
    const mcp = new McpClient();
    const { results } = await mcp.queryCollection(collection, field, compareValue);
    return results;
  } catch (error) {
    console.log(`Something went wrong: ${(error as Error).message}`);
    return [];
  }
};

export const QueryData = async (options: QueryOptions) => {
  const results = await query({ collection: 'data', ...options });
  console.log(results);
};

export const QueryModules = async (options: QueryOptions) => {
  console.log('QueryModules', options);
  const results = await query({ collection: 'modules', ...options });
  console.log(results);
};

export const Get = async (options: QueryOptions & { output?: string }) => {
  const { output } = options;
  const data = await query(options);
  const downloads = data.map(async (value) => {
    const { filePath } = value as { filePath: string };

    // Create directory if output specified
    const dataIdFolder = `${output ? output : '.'}/`;
    try {
      await access(dataIdFolder);
    } catch {
      await mkdir(dataIdFolder, { recursive: true });
    }

    const filename = filePath.split('/').pop();
    const remotePathInProject = filePath.replace(/^projects\/[^/]+\//, '');
    const localFilePath = `${dataIdFolder}/${filename}`;
    
    try {
      await stat(localFilePath!);
      console.log(`local file already exists: ${localFilePath}`);
      return localFilePath;
    } catch {
      try {
        const mcp = new McpClient();
        const { url: downloadUrl } = await mcp.getDownloadUrl(remotePathInProject);
    
        const downloadResponse = await fetch(downloadUrl);
    
        if (!downloadResponse.ok  || !downloadResponse.body) {
          throw new Error(`HTTP error! status: ${downloadResponse.status}`);
        }
    
        const writeStream = createWriteStream(localFilePath);
        await pipeline(downloadResponse.body, writeStream);
        return localFilePath;
      } catch (err) {
        console.error('Error:', (err as Error).message);
        throw err;
      }
    }
  });

  const results = await Promise.all(downloads);
  console.log(JSON.stringify(results, undefined, 2));
};
