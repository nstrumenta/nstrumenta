# Frontend

Angular web application for project management, data visualization, and real-time sensor monitoring.

## Development

```shell
npm install
npm run serve
```

Open http://localhost:5008. Add `localhost` to Firebase authorized domains.

## Deploy to Firebase Hosting

```shell
export FIREBASE_PROJECT_ID=<your-project-id>
node fetchFirebaseConfigJson.js && npm run build && ./deployFirebase.sh
```

### setCors on bucket (needs login) 
```shell
FIREBASE_PROJECT_ID=[firebase project id] ./setCors.sh
```

for DNS, set A record in dns and add domain to authorized domains in Firebase -> auth -> authorized domains

