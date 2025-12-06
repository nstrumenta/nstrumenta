import { readFileSync } from "fs"
//read filename from argument
const filename = process.argv[2]
console.log(JSON.stringify(JSON.parse(readFileSync(filename))))