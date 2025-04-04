const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create output directory
const outputDir = 'MedAssist';
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

// Step 4: Create launcher.js file
console.log('Creating launcher...');
const launcherJsContent = `
const { spawn } = require('child_process');
const path = require('path');
const { exec } = require('child_process');

console.log('Starting MedAssist Server...');

// Start the server process
const serverProcess = spawn('node', ['dist/server.js'], {
  cwd: __dirname,
  stdio: 'ignore', // Hide console output
  detached: true  // Allow the process to run independently
});

// Detach process so it doesn't keep the launcher open
serverProcess.unref();

// Wait a moment for the server to start
setTimeout(() => {
  // Open the browser
  const url = 'http://localhost:5000';
  console.log('Opening browser at ' + url);
  
  // Open default browser based on platform
  const platform = process.platform;
  if (platform === 'win32') {
    exec('start ' + url);
  } else if (platform === 'darwin') {
    exec('open ' + url);
  } else {
    exec('xdg-open ' + url);
  }
  
  // Exit this launcher process
  setTimeout(() => process.exit(0), 3000);
}, 3000);
`;

fs.writeFileSync(path.join(outputDir, 'launcher.js'), launcherJsContent);

// Create MedAssist.exe.bat file (Windows launcher)
const batchContent = `@echo off
echo Starting MedAssist...
cd %~dp0
start /min "" node launcher.js
`;

fs.writeFileSync(path.join(outputDir, 'MedAssist.exe'), batchContent);

// Create a shortcut icon file
const iconJsContent = `
const fs = require('fs');
const path = require('path');

// Read the SVG content
const svgContent = fs.readFileSync(path.join(__dirname, 'public', 'favicon.svg'), 'utf8');

// Create a simple HTML file that displays the icon
const htmlContent = \`
<!DOCTYPE html>
<html>
<head>
  <title>MedAssist Icon</title>
  <style>
    body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
    svg { width: 256px; height: 256px; }
  </style>
</head>
<body>
  \${svgContent}
</body>
</html>
\`;

// Write the HTML file
fs.writeFileSync(path.join(__dirname, 'icon.html'), htmlContent);

// Open the HTML file in the default browser
const { exec } = require('child_process');
const platform = process.platform;
const htmlPath = path.join(__dirname, 'icon.html');

if (platform === 'win32') {
  exec('start ' + htmlPath);
} else if (platform === 'darwin') {
  exec('open ' + htmlPath);
} else {
  exec('xdg-open ' + htmlPath);
}
`;

fs.writeFileSync(path.join(outputDir, 'icon.js'), iconJsContent);

// Step 5: Create a README file
const readmeContent = `# MedAssist

First Aid and Medical Assistance Application

## How to start the application

1. Double-click on the MedAssist.exe file
2. The application server will start in the background
3. Your default web browser will automatically open to the application
4. If the browser doesn't open automatically, visit http://localhost:5000

## Support

For support, please contact the MedAssist team.
`;

fs.writeFileSync(path.join(outputDir, 'README.txt'), readmeContent);

console.log('Application packaging completed!');
console.log(`You can find the packaged application in the '${outputDir}' folder.`);
console.log('To start the application, run the MedAssist.exe file in that folder.');