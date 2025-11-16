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

## 4. Authenticate from VS Code

The server now exposes a lightweight OpenID Connect surface so VS Code can use its built-in OAuth client, while the direct header approach continues to work for scripts and quick tests.

### Option A – Direct header (legacy/debug)

1. Open the Model Context settings (either User Settings search for “MCP Servers” or add a workspace `mcp.json`).
2. Add an entry like this (mirrors the example below):

```json
{
  "servers": [
    {
      "name": "nstrumentaDev",
      "type": "http",
      "url": "http://localhost:5999/",
      "headers": {
        "X-Api-Key": "${input:apiKey}"
      }
    }
  ]
}
```

When the Model Context prompt asks for `apiKey`, paste the `keyId:keySecret` string. VS Code remembers the value for the current session but never writes it to disk. You can now also supply the same value in an `Authorization: Bearer <keyId:keySecret>` header anywhere in the stack. The MCP JSON-RPC endpoint listens on `POST /`, so pointing VS Code (or curl) at the server root is all that’s required.

### Option B – VS Code OAuth (preferred)

VS Code now auto-discovers both the OAuth endpoints and the dynamic client registration endpoint at `http://localhost:5999/oauth/register`. In practice this means VS Code registers itself (supplying the `http://127.0.0.1:<port>` and `https://vscode.dev/redirect` URIs), remembers the returned `client_id`, and then completes the auth-code flow with zero manual prompts.

When testing manually, you can mirror the same steps:

1. **Register a client** – send the redirect URIs VS Code would use:

   ```bash
   curl -X POST http://localhost:5999/oauth/register \
     -H "Content-Type: application/json" \
     -d '{"redirect_uris":["http://127.0.0.1:33418","https://vscode.dev/redirect"],"client_name":"manual-debug"}'
   ```

   The response includes `client_id` and you can repeat this whenever the server restarts (registrations are stored in-memory).

2. **Authorization code** – present your API key via header and request a code for that `client_id` + redirect URI:

   ```bash
   curl -i \
     -H "X-Api-Key: ${API_KEY}" \
     "http://localhost:5999/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=http://127.0.0.1:37871/callback&response_type=code&state=debug"
   ```

   - `redirect_uri` must be either `http://127.0.0.1:<port>` or `https://vscode.dev/redirect`.
   - The server responds with `302 ...?code=XYZ&state=debug` and the code remains valid for five minutes.

3. **Token exchange** – trade the code for a bearer token (which is just the original API key so the rest of the stack stays unchanged):

   ```bash
   curl -X POST http://localhost:5999/oauth/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=authorization_code&code=${CODE}&redirect_uri=http://127.0.0.1:37871/callback&client_id=${CLIENT_ID}"
   ```

   The JSON payload looks like:

   ```json
   {
     "access_token": "keyId:keySecret",
     "token_type": "Bearer",
     "expires_in": 3600,
     "project_id": "projects/dev-demo"
   }
   ```

4. VS Code stores the `access_token` and automatically sends `Authorization: Bearer ...` on every MCP request. Because the MCP middleware now recognizes both `X-Api-Key` and bearer headers, no additional configuration is needed once the token is issued.

## 5. Use the tools

- Each API key is locked to a single project, so the MCP server automatically scopes every tool call to that project—no need for extra headers.
- Revoke the key when you finish your dev session or if it ever leaks; the next session can create a new key in seconds.
- With a valid key in place, the usual tools (`list_modules`, `list_data`, `list_agents`, `run_module`, etc.) appear immediately in the Model Context UI.
