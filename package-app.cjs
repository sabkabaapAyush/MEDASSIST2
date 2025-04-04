const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create output directory
const outputDir = 'medassist-app';
console.log(`Creating MedAssist application in ${outputDir}...`);

// Clean previous build if exists
if (fs.existsSync(outputDir)) {
  console.log('Cleaning previous build...');
  fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir);

// Step 1: Build the frontend application
console.log('Building the React frontend...');
execSync('npx vite build', { stdio: 'inherit' });

// Step 2: Build the backend server
console.log('Building the Node.js backend...');
execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=cjs --outfile=dist/server.js', { stdio: 'inherit' });

// Step 3: Copy necessary files to output directory
console.log('Copying files...');
fs.cpSync('dist', path.join(outputDir, 'dist'), { recursive: true });
fs.cpSync('public', path.join(outputDir, 'public'), { recursive: true });
fs.cpSync('node_modules', path.join(outputDir, 'node_modules'), { recursive: true });
fs.cpSync('server', path.join(outputDir, 'server'), { recursive: true });
fs.cpSync('shared', path.join(outputDir, 'shared'), { recursive: true });

// Step 4: Create a batch file to start the application
console.log('Creating startup batch file...');
const batchContent = `@echo off
echo Starting MedAssist...
cd %~dp0
node dist/server.js
`;

fs.writeFileSync(path.join(outputDir, 'MedAssist.bat'), batchContent);

// Step 5: Create a simple README file
const readmeContent = `# MedAssist

First Aid and Medical Assistance Application

## How to start the application

1. Double-click on the MedAssist.bat file
2. Wait for the application to start
3. The application will automatically open in your default web browser
4. If it doesn't open automatically, visit http://localhost:5000 in your browser

## Support

For support, please contact the MedAssist team.
`;

fs.writeFileSync(path.join(outputDir, 'README.txt'), readmeContent);

console.log('Application packaging completed!');
console.log(`You can find the packaged application in the '${outputDir}' folder.`);
console.log('To start the application, run the MedAssist.bat file in that folder.');