import os
import unittest
import time
from nstrumenta import NstrumentaClient

class TestClient(unittest.TestCase):    
    def test_get_project(self):
        client = NstrumentaClient(os.getenv('NSTRUMENTA_API_KEY'))
        data = client.get_project()
        print(data)
        ## assert that the response is not empty
        self.assertTrue(data)

    def test_list_storage_objects(self):
        client = NstrumentaClient(os.getenv('NSTRUMENTA_API_KEY'))
        data = client.list_storage_objects()
        filePath = data[0]['data']['filePath']
        download_url = client.get_project_download_url(filePath)
        self.assertTrue(download_url.startswith("https://"))

    def test_upload_download(self):
        client = NstrumentaClient(os.getenv('NSTRUMENTA_API_KEY'))
        timestamp = int(time.time())
        local_file = f"tests/temp/test_{timestamp}.txt"
        path = f"test_{timestamp}.txt"

        # Create a dynamic file for the test
        with open(local_file, "w") as file:
            file.write(f"This is a test file timestamp={timestamp}.")

        client.upload(local_file, path)
        download_path = "tests/temp/test_download.txt"
        client.download(path, download_path)
        self.assertTrue(os.path.exists(download_path))
        os.remove(download_path)
    
    def test_upload_duplicate(self):
        client = NstrumentaClient(os.getenv('NSTRUMENTA_API_KEY'))
        timestamp = int(time.time())
        local_file = f"tests/temp/test_{timestamp}.txt"
        path = f"test_{timestamp}.txt"

        # Create a dynamic file for the test
        with open(local_file, "w") as file:
            file.write(f"This is a test file timestamp={timestamp}.")

        client.upload(local_file, path)
        with self.assertRaises(FileExistsError):
            client.upload(local_file, path)

        client.upload(local_file, path, overwrite=True)        
        os.remove(local_file)
    
    def test_list_modules(self):
        client = NstrumentaClient(os.getenv('NSTRUMENTA_API_KEY'))
        data = client.list_modules()
        print(data)
        self.assertTrue(data)

if __name__ == '__main__':
    unittest.main()