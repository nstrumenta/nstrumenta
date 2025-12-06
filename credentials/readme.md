# Credentials for your project
these are intentionally not checked in to the source repository
```
cluster % ls -a credentials
.                       .gitignore              apiKey.json             readme.md
..                      .vscode                 firebaseConfig.js       singleLineFromJson.mjs
.env                    activate.sh             nstrumenta-admin.json
```

make a .js file from the firebase config object
https://firebase.google.com/docs/web/learn-more?authuser=0&hl=en#config-object

### firebaseConfig.js
```js
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
  measurementId: '',
};
```

### .env file with 
```env
GCLOUD_SERVICE_KEY=[contents of keyfile]
NSTRUMENTA_API_KEY=[nstrumenta project api key]
```

the key from your firebase admin service account
https://cloud.google.com/iam/docs/keys-create-delete

### nstrumenta-admin.json 
```json
{
  "type": "service_account",
  "project_id": "PROJECT_ID",
  "private_key_id": "KEY_ID",
  "private_key": "-----BEGIN PRIVATE KEY-----\nPRIVATE_KEY\n-----END PRIVATE KEY-----\n",
  "client_email": "SERVICE_ACCOUNT_EMAIL",
  "client_id": "CLIENT_ID",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://accounts.google.com/o/oauth2/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/SERVICE_ACCOUNT_EMAIL"
}
```


