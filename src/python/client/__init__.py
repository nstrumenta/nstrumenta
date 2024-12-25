from .client import NstrumentaClient

def get_download_url(api_key: str, base_url: str, project_id: str, path_in_project: str) -> str:
    client = NstrumentaClient(api_key, base_url)
    return client.get_download_url(project_id, path_in_project)