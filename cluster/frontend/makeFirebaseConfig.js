const fs = require('fs');

const config = {
    "hosting": {
        "site": `${process.env.FIREBASE_PROJECT_ID}-frontend`,
        "public": "dist",
        "ignore": [
            "firebase.json",
            "**/.*",
            "**/node_modules/**"
        ],
        "rewrites": [
            {
                "source": "**",
                "destination": "/index.html"
            }
        ]
    },
    "headers": {}
}

// Write the updated configuration to the firebase.json file.
fs.writeFileSync('firebase.json', JSON.stringify(config, null, 2));