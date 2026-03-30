# Frontend

Angular web application for project management, data visualization, and real-time sensor monitoring.

## Development

```shell
npm install
npm run serve
```

Open http://localhost:5008. Add `localhost` to Firebase authorized domains.

## Deploy

The frontend is deployed to Firebase Hosting via GitHub Actions on version tags (`v*`). Terraform manages the Firebase Hosting site and custom domain configuration.

Manual deploy (if needed):

```shell
export FIREBASE_PROJECT_ID=<your-project-id>
./deploy.sh
```

## Firebase Authentication

Update Firebase authorized domains in the Firebase Console:
- Navigate to Authentication > Settings > Authorized domains
- Add your custom domain (e.g. `nstrumenta.com`)

## CORS

CORS on the default appspot bucket is managed by Terraform. No manual steps required.
