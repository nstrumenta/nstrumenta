import requests
import base64


class NstrumentaClient:
    def __init__(self, api_key):
        self.api_key = api_key.split(":")[0]
        self.api_url = base64.b64decode(api_key.split(":")[1]).decode("utf-8")
        self.headers = {"x-api-key": self.api_key, "Content-Type": "application/json"}

    def get_project_download_url(self, path: str) -> str:
        url = f"{self.api_url}/getProjectDownloadUrl"
        payload = {"path": path}
        response = requests.post(url, json=payload, headers=self.headers)
        if response.status_code == 200:
            return response.text
        elif response.status_code == 404:
            raise FileNotFoundError(response.text)
        else:
            response.raise_for_status()

    def list_storage_objects(self) -> list:
        url = f"{self.api_url}/listStorageObjects"
        payload = {"type": "data"}
        response = requests.post(url, json=payload, headers=self.headers)
        if response.status_code == 200:
            return response.json()
        else:
            response.raise_for_status()
