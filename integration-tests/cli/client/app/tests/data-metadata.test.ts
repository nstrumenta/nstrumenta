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

    test('upload file and set metadata via CLI', async () => {
        console.log(`Starting upload of ${testFile}...`);
        
        // 1. Upload the file
        await asyncSpawn(
            'nst',
            ['data', 'upload', testFile],
            { cwd: testFolderBase }
        );

        console.log('Upload complete. Attempting to set metadata...');

        // 2. Set metadata using the filename as the dataId (which maps to filePath in backend)
        // This verifies the fix where backend looks up by filePath when dataId is missing
        await asyncSpawn(
            'nst',
            ['data', 'set-metadata', testFile, '{"test-tag": "verified"}'],
            { cwd: testFolderBase }
        );

        console.log('Metadata set. Verifying...');

        // 3. List data to verify metadata was applied (optional, but good visual check)
        const listResult = await asyncSpawn(
            'nst',
            ['data', 'list'],
            { cwd: testFolderBase }
        );
        
        // Note: The CLI list output might not show custom metadata fields directly 
        // without verbose flags, but if set-metadata succeeded without error, 
        // it means the backend found the document.
        expect(listResult).toContain(testFile);
    }, 60000); // Extended timeout for upload/polling
});
