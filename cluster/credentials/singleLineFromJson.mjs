import { readFileSync } from "fs"
console.log(JSON.stringify(JSON.parse(readFileSync('./nstrumenta-admin.json'))))