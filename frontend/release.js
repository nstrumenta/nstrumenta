#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

// Read current package.json
const packagePath = './package.json';
const package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Increment patch version
const versionParts = package.version.split('.');
const newPatchVersion = parseInt(versionParts[2]) + 1;
const newVersion = `${versionParts[0]}.${versionParts[1]}.${newPatchVersion}`;

console.log(`Bumping version from ${package.version} to ${newVersion}`);

// Update package.json
package.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(package, null, 2) + '\n');

// Get current date
const now = new Date();
const dateString = now.toISOString().split('T')[0];

// Get recent commits for changelog (since last version tag)
let commits = '';
try {
  // Get commits since last version
  const gitLog = execSync('git log --oneline --no-merges -10', { encoding: 'utf8' });
  const commitLines = gitLog.trim().split('\n');
  
  if (commitLines.length > 0) {
    commits = commitLines
      .slice(0, 5) // Limit to 5 recent commits
      .map(line => {
        const [hash, ...messageParts] = line.split(' ');
        const message = messageParts.join(' ');
        return `* ${message} ([${hash}](https://github.com/nstrumenta/nstrumenta/commit/${hash}))`;
      })
      .join('\n');
  }
} catch (error) {
  console.log('Could not get git commits, using generic entry');
  commits = '* Various improvements and bug fixes';
}

// Read current CHANGELOG.md
const changelogPath = './CHANGELOG.md';
let changelog = '';
if (fs.existsSync(changelogPath)) {
  changelog = fs.readFileSync(changelogPath, 'utf8');
}

// Create new changelog entry
const newEntry = `
### [${newVersion}](https://github.com/nstrumenta/nstrumenta/compare/v${package.version}...v${newVersion}) (${dateString})

${commits}

`;

// Insert new entry after the header
const headerEnd = changelog.indexOf('\n\n') + 2;
const newChangelog = changelog.slice(0, headerEnd) + newEntry + changelog.slice(headerEnd);

// Write updated changelog
fs.writeFileSync(changelogPath, newChangelog);

console.log('Updated CHANGELOG.md');

// Stage and commit changes
try {
  execSync('git add package.json CHANGELOG.md', { stdio: 'inherit' });
  execSync(`git commit -m "chore(release): ${newVersion}"`, { stdio: 'inherit' });
  console.log(`Successfully created release ${newVersion}`);
} catch (error) {
  console.error('Error committing changes:', error.message);
  process.exit(1);
}