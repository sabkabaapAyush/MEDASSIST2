const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const builder = require('electron-builder');

console.log('Building MedAssist application...');

// Step 1: Build the frontend application
console.log('Building the React frontend...');
execSync('npx vite build', { stdio: 'inherit' });

// Step 2: Build the backend application
console.log('Building the Node.js backend...');
execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=cjs --outfile=dist/server.js', { stdio: 'inherit' });

// Step 3: Create a package.json for the packaged app
console.log('Creating production package.json...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const prodPackageJson = {
  name: "medassist",
  version: packageJson.version || "1.0.0",
  description: "MedAssist First Aid Application",
  main: "electron/main.js",
  author: "MedAssist Team",
  license: packageJson.license || "MIT",
  dependencies: packageJson.dependencies
};

fs.writeFileSync('dist/package.json', JSON.stringify(prodPackageJson, null, 2));

// Step 4: Copy necessary files to dist
console.log('Copying files...');
fs.cpSync('public', 'dist/public', { recursive: true });
fs.cpSync('electron', 'dist/electron', { recursive: true });

// Step 5: Build with electron-builder
console.log('Building Electron application...');
builder.build({
  targets: builder.Platform.WINDOWS.createTarget(),
  config: {
    appId: "com.medassist.app",
    productName: "MedAssist",
    directories: {
      output: "dist-electron"
    },
    files: [
      "dist/**/*",
      "!node_modules/**/*"
    ],
    win: {
      target: "portable",
      icon: "public/favicon.svg"
    }
  }
}).then(() => {
  console.log('Build completed successfully!');
  console.log('You can find the executable in the dist-electron folder.');
}).catch((err) => {
  console.error('Error building application:', err);
});