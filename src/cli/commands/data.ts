import { createWriteStream } from 'fs';
import { access, mkdir, readFile, rm, stat, writeFile } from 'fs/promises';
import { pipeline as streamPipeline } from 'stream';
import { promisify } from 'util';
import { QueryOptions } from '../../shared';
import { asyncSpawn, endpoints, resolveApiKey } from '../utils';
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
  const apiKey = resolveApiKey();

  const config = {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'data' }),
  };

  try {
    const response = await fetch(endpoints.LIST_STORAGE_OBJECTS, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log(JSON.stringify(data, undefined, 2));
  } catch (err) {
    console.error('Error:', (err as Error).message);
  }
};

export interface DataMountOptions {}
export const Mount = async (_: unknown, options: DataMountOptions) => {
  const apiKey = resolveApiKey();

  const config = {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
  };

  let bucket: string | undefined;
  let projectId: string | undefined;

  try {
    const response = await fetch(endpoints.GET_DATA_MOUNT, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    ({ bucket, projectId } = data as { bucket: string; projectId: string });
  } catch (err) {
    console.error('Error:', (err as Error).message);
  }

  if (bucket === undefined) {
    throw new Error('bucket undefined in response from getDataMount');
  }

  const serviceKeyJson = process.env.GCLOUD_SERVICE_KEY;
  if (serviceKeyJson == undefined) throw new Error('GCLOUD_SERVICE_KEY undefined');

  // check for gcsfuse
  await asyncSpawn('gcsfuse', ['-v'], { quiet: true });

  await mkdir(`${projectId}/data`, { recursive: true });
  await writeFile(`${projectId}/.gitignore`, 'keyfile.json\ndata');
  const keyfilePath = `${projectId}/keyfile.json`;
  await writeFile(keyfilePath, serviceKeyJson);
  await asyncSpawn(
    'gcsfuse',
    [
      `--implicit-dirs`,
      `--only-dir=projects/${projectId}/data`,
      `--key-file=${keyfilePath}`,
      `${bucket}`,
      `${projectId}/data`,
    ],
    { quiet: true }
  );
};

export interface DataUnmountOptions {}
export const Unmount = async (_: unknown, options: DataUnmountOptions) => {
  const apiKey = resolveApiKey();

  const config = {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
  };

  let bucket: string | undefined;
  let projectId: string | undefined;

  try {
    const response = await fetch(endpoints.GET_DATA_MOUNT, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    ({ bucket, projectId } = data as { bucket: string; projectId: string });
  } catch (err) {
    console.error('Error:', (err as Error).message);
  }
  if (bucket === undefined) {
    throw new Error('bucket undefined in response from getDataMount');
  }

  // check for gcsfuse
  await asyncSpawn('gcsfuse', ['-v'], { quiet: true });
  await asyncSpawn('fusermount', ['-u', `${projectId}/data`], { quiet: true });
  await rm(`${projectId}`, { recursive: true, force: true });
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
      return console.log(`Error uploading ${filename}: ${(error as Error).message}`);
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
  const apiKey = resolveApiKey();
  let fileBuffer;
  let size;
  let url;
  let remoteFilePath: string = '';

  fileBuffer = await readFile(filename);
  size = fileBuffer.length;
  const name = filename.split('/').pop();

  const config = {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      size,
      metadata: { tags },
      overwrite,
    }),
  };

  try {
    let response = await fetch(endpoints.GET_UPLOAD_DATA_URL, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as { uploadUrl: string; remoteFilePath: string };
    url = data.uploadUrl;
    remoteFilePath = data.remoteFilePath;

    const putConfig = {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes 0-${size - 1}/${size}`,
      },
      body: fileBuffer,
    };

    response = await fetch(url, putConfig);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (err) {
    console.error('Error:', (err as Error).message);
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
  const apiKey = resolveApiKey();

  const config = {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ field, comparison, compareValue, limit, collection }),
  };
  
  try {
    const response = await fetch(endpoints.QUERY_COLLECTION, config);
  
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  
    const data = await response.json() as Array<Record<string, unknown>>;
    return data;
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
      const downloadUrlData = { path: remotePathInProject };
      const downloadUrlConfig = {
        method: 'POST',
        headers: { 'x-api-key': resolveApiKey(), 'content-type': 'application/json' },
        body: JSON.stringify(downloadUrlData),
      };
    
      try {
        const getDownloadUrl = await fetch(endpoints.GET_PROJECT_DOWNLOAD_URL, downloadUrlConfig);
    
        if (!getDownloadUrl.ok) {
          throw new Error(`HTTP error! status: ${getDownloadUrl.status}`);
        }
    
        const downloadUrl = ((await getDownloadUrl.json()) as string).replace(/^\/?projects\/(\w)+\/?/, '');
    
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
