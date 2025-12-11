import os
import unittest
import time
from unittest.mock import Mock, patch, mock_open
from nstrumenta import NstrumentaClient


class TestClientUnit(unittest.TestCase):
    """Unit tests using mocks"""
    
    def setUp(self):
        self.api_key = "test_key:dGVzdC11cmw="  # base64 encoded "test-url"
        self.client = NstrumentaClient(self.api_key)
    
    def test_init(self):
        """Test client initialization"""
        self.assertEqual(self.client.api_key, "test_key")
        self.assertEqual(self.client.api_url, "test-url")
        self.assertEqual(self.client.headers["x-api-key"], "test_key")
        self.assertEqual(self.client.headers["Content-Type"], "application/json")
    
    @patch('requests.post')
    def test_get_project_success(self, mock_post):
        """Test get_project with successful response"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"name": "test-project"}
        mock_post.return_value = mock_response
        
        result = self.client.get_project()
        
        self.assertEqual(result, {"name": "test-project"})
        mock_post.assert_called_once_with(
            "test-url/getProject",
            headers=self.client.headers
        )
    
    @patch('requests.post')
    def test_get_project_not_found(self, mock_post):
        """Test get_project with 404 response"""
        mock_response = Mock()
        mock_response.status_code = 404
        mock_response.text = "Project not found"
        mock_post.return_value = mock_response
        
        with self.assertRaises(FileNotFoundError):
            self.client.get_project()
    
    @patch('requests.post')
    def test_get_project_download_url_success(self, mock_post):
        """Test get_project_download_url with successful response"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.text = "https://storage.googleapis.com/test/path"
        mock_post.return_value = mock_response
        
        result = self.client.get_project_download_url("test/path.txt")
        
        self.assertEqual(result, "https://storage.googleapis.com/test/path")
        mock_post.assert_called_once_with(
            "test-url/getProjectDownloadUrl",
            json={"path": "test/path.txt"},
            headers=self.client.headers
        )
    
    @patch('requests.post')
    def test_get_project_download_url_not_found(self, mock_post):
        """Test get_project_download_url with 404 response"""
        mock_response = Mock()
        mock_response.status_code = 404
        mock_response.text = "File not found"
        mock_post.return_value = mock_response
        
        with self.assertRaises(FileNotFoundError):
            self.client.get_project_download_url("nonexistent.txt")
    
    @patch('requests.post')
    def test_get_upload_data_url_success(self, mock_post):
        """Test get_upload_data_url with successful response"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"uploadUrl": "https://storage.googleapis.com/upload"}
        mock_post.return_value = mock_response
        
        result = self.client.get_upload_data_url("test.txt")
        
        self.assertEqual(result, "https://storage.googleapis.com/upload")
        mock_post.assert_called_once_with(
            "test-url/getUploadDataUrl",
            json={"name": "test.txt", "overwrite": False},
            headers=self.client.headers
        )
    
    @patch('requests.post')
    def test_get_upload_data_url_conflict(self, mock_post):
        """Test get_upload_data_url with file exists error"""
        mock_response = Mock()
        mock_response.status_code = 409
        mock_post.return_value = mock_response
        
        with self.assertRaises(FileExistsError):
            self.client.get_upload_data_url("existing.txt")
    
    @patch('requests.post')
    def test_get_upload_data_url_with_overwrite(self, mock_post):
        """Test get_upload_data_url with overwrite flag"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"uploadUrl": "https://storage.googleapis.com/upload"}
        mock_post.return_value = mock_response
        
        result = self.client.get_upload_data_url("test.txt", overwrite=True)
        
        self.assertEqual(result, "https://storage.googleapis.com/upload")
        call_args = mock_post.call_args
        self.assertTrue(call_args[1]["json"]["overwrite"])
    
    @patch('requests.post')
    def test_get_upload_url_success(self, mock_post):
        """Test get_upload_url with successful response"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"uploadUrl": "https://storage.googleapis.com/upload"}
        mock_post.return_value = mock_response
        
        result = self.client.get_upload_url("test.txt")
        
        self.assertEqual(result, "https://storage.googleapis.com/upload")
        mock_post.assert_called_once_with(
            "test-url/getUploadUrl",
            json={"path": "test.txt", "overwrite": False},
            headers=self.client.headers
        )
    
    @patch('requests.post')
    def test_list_storage_objects_success(self, mock_post):
        """Test list_storage_objects with successful response"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {"data": {"filePath": "file1.txt"}},
            {"data": {"filePath": "file2.txt"}}
        ]
        mock_post.return_value = mock_response
        
        result = self.client.list_storage_objects()
        
        self.assertEqual(len(result), 2)
        mock_post.assert_called_once_with(
            "test-url/listStorageObjects",
            json={"type": "data"},
            headers=self.client.headers
        )
    
    @patch('requests.post')
    def test_list_modules_success(self, mock_post):
        """Test list_modules with successful response"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {"name": "module1"},
            {"name": "module2"}
        ]
        mock_post.return_value = mock_response
        
        result = self.client.list_modules()
        
        self.assertEqual(len(result), 2)
        mock_post.assert_called_once_with(
            "test-url/listModules",
            headers=self.client.headers
        )
    
    @patch('requests.get')
    @patch('builtins.open', new_callable=mock_open)
    def test_download_success(self, mock_file, mock_get):
        """Test download with successful response"""
        mock_response = Mock()
        mock_response.content = b"file content"
        mock_get.return_value = mock_response
        
        with patch.object(self.client, 'get_project_download_url', return_value="https://test.url"):
            result = self.client.download("test.txt", "dest.txt")
        
        self.assertEqual(result, "dest.txt")
        mock_file.assert_called_once_with("dest.txt", "wb")
        mock_file().write.assert_called_once_with(b"file content")
    
    @patch('requests.put')
    @patch('builtins.open', new_callable=mock_open, read_data=b"test data")
    def test_upload_success(self, mock_file, mock_put):
        """Test upload with successful response"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.text = "Upload successful"
        mock_put.return_value = mock_response
        
        with patch.object(self.client, 'get_upload_data_url', return_value="https://upload.url"):
            result = self.client.upload("local.txt", "remote.txt")
        
        self.assertEqual(result, "Upload successful")
        mock_file.assert_called_once_with("local.txt", "rb")
    
    @patch('requests.put')
    @patch('builtins.open', new_callable=mock_open, read_data=b"test data")
    def test_upload_conflict(self, mock_file, mock_put):
        """Test upload with file exists error"""
        mock_response = Mock()
        mock_response.status_code = 409
        mock_response.text = "File already exists"
        mock_put.return_value = mock_response
        
        with patch.object(self.client, 'get_upload_data_url', return_value="https://upload.url"):
            with self.assertRaises(FileExistsError):
                self.client.upload("local.txt", "remote.txt")
    
    @patch('requests.put')
    @patch('builtins.open', new_callable=mock_open, read_data=b"test data")
    def test_upload_with_overwrite(self, mock_file, mock_put):
        """Test upload with overwrite flag"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.text = "Upload successful"
        mock_put.return_value = mock_response
        
        with patch.object(self.client, 'get_upload_data_url', return_value="https://upload.url") as mock_url:
            self.client.upload("local.txt", "remote.txt", overwrite=True)
            mock_url.assert_called_once_with("remote.txt", True)


class TestClientIntegration(unittest.TestCase):
    """Integration tests requiring real API key"""
    
    @unittest.skipUnless(os.getenv('NSTRUMENTA_API_KEY'), "API key required for integration tests")
    def test_get_project(self):
        client = NstrumentaClient(os.getenv('NSTRUMENTA_API_KEY'))
        data = client.get_project()
        self.assertTrue(data)

    @unittest.skipUnless(os.getenv('NSTRUMENTA_API_KEY'), "API key required for integration tests")
    def test_list_storage_objects(self):
        client = NstrumentaClient(os.getenv('NSTRUMENTA_API_KEY'))
        data = client.list_storage_objects()
        if len(data) > 0:
            filePath = data[0]['data']['filePath']
            download_url = client.get_project_download_url(filePath)
            self.assertTrue(download_url.startswith("https://"))

    @unittest.skipUnless(os.getenv('NSTRUMENTA_API_KEY'), "API key required for integration tests")
    def test_upload_download(self):
        client = NstrumentaClient(os.getenv('NSTRUMENTA_API_KEY'))
        timestamp = int(time.time())
        local_file = f"tests/temp/test_{timestamp}.txt"
        path = f"test_{timestamp}.txt"

        os.makedirs("tests/temp", exist_ok=True)
        with open(local_file, "w") as file:
            file.write(f"This is a test file timestamp={timestamp}.")

        client.upload(local_file, path)
        download_path = "tests/temp/test_download.txt"
        client.download(path, download_path)
        self.assertTrue(os.path.exists(download_path))
        os.remove(download_path)
        os.remove(local_file)
    
    @unittest.skipUnless(os.getenv('NSTRUMENTA_API_KEY'), "API key required for integration tests")
    def test_upload_duplicate(self):
        client = NstrumentaClient(os.getenv('NSTRUMENTA_API_KEY'))
        timestamp = int(time.time())
        local_file = f"tests/temp/test_{timestamp}.txt"
        path = f"test_{timestamp}.txt"

        os.makedirs("tests/temp", exist_ok=True)
        with open(local_file, "w") as file:
            file.write(f"This is a test file timestamp={timestamp}.")

        client.upload(local_file, path)
        with self.assertRaises(FileExistsError):
            client.upload(local_file, path)

        client.upload(local_file, path, overwrite=True)        
        os.remove(local_file)
    
    @unittest.skipUnless(os.getenv('NSTRUMENTA_API_KEY'), "API key required for integration tests")
    def test_list_modules(self):
        client = NstrumentaClient(os.getenv('NSTRUMENTA_API_KEY'))
        data = client.list_modules()
        self.assertTrue(isinstance(data, list))


if __name__ == '__main__':
    unittest.main()