import os
import unittest
from client import NstrumentaClient

class TestClient(unittest.TestCase):
    def test_hello_world(self):
        self.assertEqual("Hello, World!", "Hello, World!")
    
    def test_list_storage_objects(self):
        client = NstrumentaClient(os.getenv('NSTRUMENTA_API_KEY'))
        data = client.list_storage_objects()
        filePath = data[0]['data']['filePath']
        download_url = client.get_project_download_url(filePath)
        self.assertTrue(download_url.startswith("https://"))

if __name__ == '__main__':
    unittest.main()