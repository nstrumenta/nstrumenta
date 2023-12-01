const fs = require('fs');
fetch(
  `https://storage.googleapis.com/${process.env.FIREBASE_PROJECT_ID}-config/firebaseConfig.json`
)
  .then((res) => res.json())
  .then((firebaseConfig) => {
    console.log(firebaseConfig);
    fs.writeFileSync('src/environments/firebaseConfig.json', JSON.stringify(firebaseConfig));
  });
