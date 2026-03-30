const fs = require('fs');

const siteId = `${process.env.FIREBASE_PROJECT_ID}-frontend`;
const cloudRunRegion = process.env.CLOUD_RUN_REGION || 'us-west1';
const cloudRunServiceId = process.env.CLOUD_RUN_SERVICE_ID || 'cloudrun-service';

const config = {
    "hosting": {
        "site": siteId,
        "public": "dist",
        "ignore": [
            "firebase.json",
            "**/.*",
            "**/node_modules/**"
        ],
        "rewrites": [
            {
                "source": "/api/**",
                "run": {
                    "serviceId": cloudRunServiceId,
                    "region": cloudRunRegion
                }
            },
            {
                "source": "/mcp",
                "run": {
                    "serviceId": cloudRunServiceId,
                    "region": cloudRunRegion
                }
            },
            {
                "source": "/mcp/**",
                "run": {
                    "serviceId": cloudRunServiceId,
                    "region": cloudRunRegion
                }
            },
            {
                "source": "/health",
                "run": {
                    "serviceId": cloudRunServiceId,
                    "region": cloudRunRegion
                }
            },
            {
                "source": "/config",
                "run": {
                    "serviceId": cloudRunServiceId,
                    "region": cloudRunRegion
                }
            },
            {
                "source": "/oauth/**",
                "run": {
                    "serviceId": cloudRunServiceId,
                    "region": cloudRunRegion
                }
            },
            {
                "source": "/.well-known/**",
                "run": {
                    "serviceId": cloudRunServiceId,
                    "region": cloudRunRegion
                }
            },
            {
                "source": "**",
                "destination": "/index.html"
            }
        ],
        "headers": [
            {
                "source": "**/*.@(js|css)",
                "headers": [
                    { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
                ]
            }
        ]
    }
}

// Write the updated configuration to the firebase.json file.
fs.writeFileSync('firebase.json', JSON.stringify(config, null, 2));