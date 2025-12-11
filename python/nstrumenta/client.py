import requests
import base64


# export const getEndpoints = (apiKey: string) => {
#   const url = atob(apiKey.split(':')[1] ?? '').trim();
#   return {
#     ADMIN_UTILS: `${url}/adminUtils`,
#     GET_MACHINES: `${url}/getMachines`,
#     GET_CLOUD_RUN_SERVICES: `${url}/getCloudRunServices`,
#     GET_UPLOAD_URL: `${url}/getUploadUrl`,
#     GET_UPLOAD_DATA_URL: `${url}/getUploadDataUrl`,
#     GET_PROJECT: `${url}/getProject`,
#     REGISTER_AGENT: `${url}/registerAgent`,
#     LIST_AGENTS: `${url}/listAgents`,
#     SET_ACTION: `${url}/setAction`,
#     SET_AGENT_ACTION: `${url}/setAgentAction`,
#     GET_AGENT_ID_BY_TAG: `${url}/getAgentIdByTag`,
#     CLEAN_AGENT_ACTIONS: `${url}/cleanAgentActions`,
#     GET_DOWNLOAD_URL: `${url}/getDownloadUrl`,
#     GET_PROJECT_DOWNLOAD_URL: `${url}/getProjectDownloadUrl`,
#     GENERATE_DATA_ID: `${url}/generateDataId`,
#     LIST_MODULES: `${url}/listModules`,
#     GET_TOKEN: `${url}/getToken`,
#     VERIFY_TOKEN: `${url}/verifyToken`,
#     VERIFY_API_KEY: `${url}/verifyApiKey`,
#     SET_STORAGE_OBJECT: `${url}/setStorageObject`,
#     SET_DATA_METADATA: `${url}/setDataMetadata`,
#     LIST_STORAGE_OBJECTS: `${url}/listStorageObjects`,
#     GET_DATA_MOUNT: `${url}/getDataMount`,
#     QUERY_COLLECTION: `${url}/queryCollection`,
#   };
# };


class NstrumentaClient:
    def __init__(self, api_key):
        self.api_key = api_key.split(":")[0]
        self.api_url = base64.b64decode(api_key.split(":")[1]).decode("utf-8")
        self.headers = {"x-api-key": self.api_key, "Content-Type": "application/json"}

    def get_project(self) -> dict:
        url = f"{self.api_url}/getProject"
        response = requests.post(url, headers=self.headers)
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 404:
            raise FileNotFoundError(response.text)
        else:
            response.raise_for_status()

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

    def get_upload_data_url(self, path: str, overwrite: bool = False) -> str:
        url = f"{self.api_url}/getUploadDataUrl"
        payload = {"name": path, "overwrite": overwrite}
        response = requests.post(url, json=payload, headers=self.headers)
        if response.status_code == 200:
            return response.json()["uploadUrl"]
        elif response.status_code == 409:
            raise FileExistsError("The resource already exists.")
        else:
            response.raise_for_status()

    def get_upload_url(self, path: str, overwrite: bool = False) -> str:
        url = f"{self.api_url}/getUploadUrl"
        payload = {"path": path, "overwrite": overwrite}
        response = requests.post(url, json=payload, headers=self.headers)
        if response.status_code == 200:
            return response.json()["uploadUrl"]
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

    def list_modules(self) -> list:
        url = f"{self.api_url}/listModules"
        response = requests.post(url, headers=self.headers)
        if response.status_code == 200:
            return response.json()
        else:
            response.raise_for_status()

    def download(self, path: str, dest: str):
        url = self.get_project_download_url(f"data/{path}")
        response = requests.get(url)
        with open(dest, "wb") as file:
            file.write(response.content)
        return dest

    def upload(self, local_file: str, path: str, overwrite: bool = False):
        url = self.get_upload_data_url(path, overwrite)
        with open(local_file, "rb") as file:
            response = requests.put(url, data=file, headers=self.headers)
            if response.status_code == 200:
                return response.text
            if response.status_code == 409:
                raise FileExistsError(response.text)
            else:
                response.raise_for_status()
