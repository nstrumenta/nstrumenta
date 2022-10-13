import { OpenrpcDocument } from '@open-rpc/meta-schema';
import OpenRPCTypings from '@open-rpc/typings';
import { dereferenceDocument } from '@open-rpc/schema-utils-js';
import referenceResolver from '@json-schema-tools/reference-resolver';
import { OpenRPCDoc } from './rpc';
import { writeFile } from 'fs/promises';

dereferenceDocument(OpenRPCDoc, referenceResolver)
  .then((doc: OpenrpcDocument) => {
    const typings = new OpenRPCTypings(doc);

    const types = typings.toString('typescript');

    return writeFile('./rpc-types.ts', types).then(() => {
      console.log('done');
    });
  })
  .catch((error: Error) => {
    console.error(error);
  });
