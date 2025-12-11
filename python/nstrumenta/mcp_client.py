"""MCP Client for nstrumenta - Modern JSON-RPC API"""
import os
import base64
import json
import requests
from typing import Optional, Dict, Any, List, Tuple


class McpClient:
    """Client for interacting with nstrumenta MCP (Model Context Protocol) API"""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize MCP client
        
        Args:
            api_key: API key for authentication. If not provided, will look for 
                    NSTRUMENTA_API_KEY or NST_API_KEY environment variables.
        """
        # Get API key from parameter or environment
        self.api_key = api_key or os.getenv('NSTRUMENTA_API_KEY') or os.getenv('NST_API_KEY') or ''
        
        # Get server URL from environment or decode from API key
        api_url = os.getenv('NSTRUMENTA_API_URL') or os.getenv('NST_API_URL')
        if api_url:
            self.server_url = api_url
        elif self.api_key and ':' in self.api_key:
            # Decode URL from API key
            encoded_url = self.api_key.split(':')[1]
            self.server_url = base64.b64decode(encoded_url).decode('utf-8').strip()
        else:
            self.server_url = ''
    
    def _call_tool(self, tool_name: str, args: Dict[str, Any]) -> Any:
        """Call an MCP tool via JSON-RPC
        
        Args:
            tool_name: Name of the tool to call
            args: Arguments to pass to the tool
            
        Returns:
            Tool result (structured content or parsed JSON)
            
        Raises:
            Exception: If the request fails or returns an error
        """
        response = requests.post(
            f"{self.server_url}/",
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/event-stream',
                'x-api-key': self.api_key,
            },
            json={
                'jsonrpc': '2.0',
                'method': 'tools/call',
                'params': {
                    'name': tool_name,
                    'arguments': args,
                },
                'id': 1,
            }
        )
        
        if not response.ok:
            raise Exception(f"MCP request failed: {response.status_code} {response.text}")
        
        result = response.json()
        
        if 'error' in result:
            error_msg = result['error'].get('message', 'Unknown error')
            raise Exception(f"MCP error: {error_msg}")
        
        tool_result = result.get('result', {})
        if tool_result.get('isError'):
            error_text = tool_result.get('content', [{}])[0].get('text', 'Unknown error')
            raise Exception(f"Tool error: {error_text}")
        
        # Return structured content if available, otherwise parse text content
        if 'structuredContent' in tool_result:
            return tool_result['structuredContent']
        
        content = tool_result.get('content', [])
        if content and 'text' in content[0]:
            return json.loads(content[0]['text'])
        
        return tool_result
    
    def run_module(
        self,
        agent_id: str,
        module_name: str,
        version: Optional[str] = None,
        args: Optional[List[str]] = None
    ) -> Dict[str, str]:
        """Run a module on an agent
        
        Args:
            agent_id: ID of the agent to run the module on
            module_name: Name of the module to run
            version: Optional module version
            args: Optional command line arguments
            
        Returns:
            Dictionary with actionId
        """
        return self._call_tool('run_module', {
            'agentId': agent_id,
            'moduleName': module_name,
            'moduleVersion': version,
            'args': args,
        })
    
    def list_modules(self, filter: Optional[str] = None) -> Dict[str, List[Any]]:
        """List available modules
        
        Args:
            filter: Optional filter string
            
        Returns:
            Dictionary with modules list
        """
        return self._call_tool('list_modules', {'filter': filter})
    
    def list_agents(self) -> Dict[str, List[Tuple[str, Any]]]:
        """List all agents
        
        Returns:
            Dictionary with agents list
        """
        return self._call_tool('list_agents', {})
    
    def host_module(
        self,
        module_name: str,
        version: Optional[str] = None,
        args: Optional[List[str]] = None
    ) -> Dict[str, str]:
        """Host a module
        
        Args:
            module_name: Name of the module to host
            version: Optional module version
            args: Optional command line arguments
            
        Returns:
            Dictionary with actionId
        """
        return self._call_tool('host_module', {
            'moduleName': module_name,
            'moduleVersion': version,
            'args': args,
        })
    
    def cloud_run(
        self,
        module_name: str,
        version: Optional[str] = None,
        args: Optional[List[str]] = None,
        image: Optional[str] = None
    ) -> Dict[str, str]:
        """Run a module on Cloud Run
        
        Args:
            module_name: Name of the module
            version: Optional module version
            args: Optional command line arguments
            image: Optional container image
            
        Returns:
            Dictionary with actionId
        """
        return self._call_tool('cloud_run', {
            'moduleName': module_name,
            'moduleVersion': version,
            'args': args,
            'image': image,
        })
    
    def set_agent_action(self, agent_id: str, action: str) -> Dict[str, str]:
        """Set an action for an agent
        
        Args:
            agent_id: ID of the agent
            action: Action to set
            
        Returns:
            Dictionary with actionId
        """
        return self._call_tool('set_agent_action', {
            'agentId': agent_id,
            'action': action,
        })
    
    def clean_agent_actions(self, agent_id: str) -> Dict[str, bool]:
        """Clean actions for an agent
        
        Args:
            agent_id: ID of the agent
            
        Returns:
            Dictionary with success status
        """
        return self._call_tool('clean_agent_actions', {
            'agentId': agent_id,
        })
    
    def list_data(self, type: str = 'data') -> Dict[str, List[Any]]:
        """List data objects
        
        Args:
            type: Type of data to list (default: 'data')
            
        Returns:
            Dictionary with objects list
        """
        return self._call_tool('list_data', {'type': type})
    
    def get_agent_actions(
        self,
        agent_id: str,
        status: str = 'pending'
    ) -> Dict[str, List[Any]]:
        """Get actions for an agent
        
        Args:
            agent_id: ID of the agent
            status: Status filter (default: 'pending')
            
        Returns:
            Dictionary with actions list
        """
        return self._call_tool('get_agent_actions', {
            'agentId': agent_id,
            'status': status,
        })
    
    def update_agent_action(
        self,
        agent_id: str,
        action_id: str,
        status: str,
        error: Optional[str] = None
    ) -> Dict[str, bool]:
        """Update an agent action status
        
        Args:
            agent_id: ID of the agent
            action_id: ID of the action
            status: New status
            error: Optional error message
            
        Returns:
            Dictionary with success status
        """
        return self._call_tool('update_agent_action', {
            'agentId': agent_id,
            'actionId': action_id,
            'status': status,
            'error': error,
        })
