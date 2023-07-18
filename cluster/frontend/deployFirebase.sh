#!/bin/bash

# frontend % npx firebase target:apply hosting main firebase-project-id
# ✔  Applied hosting target main to firebase-project-id

# Updated: main (firebase-project-id)
npx firebase use $FIREBASE_PROJECT_ID

# frontend % npx firebase deploy --only hosting:main               

# === Deploying to 'firebase-project-id'...

# i  deploying hosting
# i  hosting[firebase-project-id]: beginning deploy...
# i  hosting[firebase-project-id]: found 26 files in dist
# ✔  hosting[firebase-project-id]: file upload complete
# i  hosting[firebase-project-id]: finalizing version...
# ⚠  hosting[firebase-project-id]: Unable to find a valid endpoint for function `getHosts`, but still including it in the config
# ✔  hosting[firebase-project-id]: version finalized
# i  hosting[firebase-project-id]: releasing new version...
# ✔  hosting[firebase-project-id]: release complete

# ✔  Deploy complete!

# Project Console: https://console.firebase.google.com/project/firebase-project-id/overview
# Hosting URL: https://firebase-project-id.web.app

npx firebase deploy --only hosting:main   