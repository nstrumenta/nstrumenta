import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'node:crypto';
import { asyncSpawn } from '../utils/AsyncSpawn';

const testId = process.env.TEST_ID || randomUUID();

describe('Data Metadata', () => {
    const testFolderBase = `./temp/${testId}/Metadata`;
    let testFile;

    beforeAll(async () => {
        testFile = `test-metadata-${testId}.txt`;
        await mkdir(testFolderBase, { recursive: true });
        await writeFile(`${testFolderBase}/${testFile}`, `metadata test content`, { encoding: 'utf8' });
    });

    test('upload file, set metadata, and read it back', async () => {
        const uploadResult = await asyncSpawn(
            'nst',
            ['data', 'upload', testFile],
            { cwd: testFolderBase }
        );
        expect(uploadResult).toContain(testFile);

        await asyncSpawn(
            'nst',
            ['data', 'set-metadata', testFile, '{"test-tag": "verified"}'],
            { cwd: testFolderBase }
        );

        const metadataResult = await asyncSpawn(
            'nst',
            ['data', 'get-metadata', testFile],
            { cwd: testFolderBase }
        );
        expect(metadataResult).toContain('verified');
    }, 30000);
});
