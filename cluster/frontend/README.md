# Frontend

angular app to manage projects, browse data, etc.

deployed to firebase hosting

## install deps including firebase cli
```shell
npm i
```

## login
```shell
npx firebase login
```

## setting up hosting
build and deploy with (replace project id with your own): 
```shell
npm run build && FIREBASE_PROJECT_ID=[firebase project id] ./deployFirebase.sh`
```

for DNS, set A record in dns and add domain to authorized domains in Firebase -> auth -> authorized domains

