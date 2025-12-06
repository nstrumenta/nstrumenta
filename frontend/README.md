# Frontend

angular app to manage projects, browse data, etc.

## dev
```shell
npm i
```

```shell
npm run serve
```

open browser to 0.0.0.0:5000 or use vscode to launch
firebase project needs 0.0.0.0 added to authorized domains https://console.firebase.google.com/project/[*project id*]/authentication/settings




## deploy to firebase hosting

### install deps including firebase cli
```shell
npm i
```

### login
```shell
npx firebase login
```

### setting up hosting
build and deploy with (replace project id with your own): 

set firebase project env var
```shell
export FIREBASE_PROJECT_ID=[firebase project id]
```

```shell
node fetchFirebaseConfigJson.js && npm run build && ./deployFirebase.sh
```

## one time setting cors on bucket

### gcloud auth with user account
```
gcloud auth login
```

### setCors on bucket (needs login) 
```shell
FIREBASE_PROJECT_ID=[firebase project id] ./setCors.sh
```

for DNS, set A record in dns and add domain to authorized domains in Firebase -> auth -> authorized domains

