# MCP dev loop in VS Code

The MCP server now authenticates requests with the same project-scoped API keys that the rest of the platform uses. VS Code can keep the key in a prompt-based `${input:...}` variable so it never needs to live on disk.

## 1. Prerequisites

- `node >= 18` and `npm`
- `GCLOUD_SERVICE_KEY` exported with your Firebase service-account JSON (matches the rest of the stack)
- An existing project in Firestore (e.g. `projects/dev-demo`)
- Frontend + server running locally (server on `5999`, Angular app on `5008`)
- An API key for that project (create from the frontend Settings → API Keys panel or by calling `/createApiKey` with an authenticated user session)

## 2. Start the services

```bash
# Terminal 1 – Express/MCP server
cd cluster/server/app
npm install
ENVFILE=../../credentials/local.env npm run dev-dotenv

# Terminal 2 – Angular frontend (handy for creating keys and checking data)
cd cluster/frontend
npm install
npm start
```

## 3. Create or fetch an API key

Project admins can create keys from the frontend’s project settings page or by calling the `createApiKey` API. Copy the full `keyId:keySecret` value exactly as shown—the MCP server expects it in the `X-Api-Key` header with no additional encoding.

Rotate or revoke keys from the same UI/API when you’re done with a dev session.

## 4. Configure VS Code’s MCP client

1. Open the Model Context settings (either User Settings search for “MCP Servers” or place a workspace `mcp.json`).
2. Add an entry like this (matches the committed [`mcp.json`](../mcp.json)):

```json
{
  "servers": [
    {
      "name": "nstrumentaDev",
      "type": "http",
      "url": "http://localhost:5999/mcp",
      "headers": {
        "X-Api-Key": "${input:apiKey}"
      }
    }
  ]
}
```

When the Model Context prompt asks for `apiKey`, paste the `keyId:keySecret` string. VS Code remembers the value for the current session but never writes it to disk.

## 5. Use the tools

- Each API key is locked to a single project, so the MCP server automatically scopes every tool call to that project—no need for extra headers.
- Revoke the key when you finish your dev session or if it ever leaks; the next session can create a new key in seconds.
- With a valid key in place, the usual tools (`list_modules`, `list_data`, `list_agents`, `run_module`, etc.) appear immediately in the Model Context UI.
