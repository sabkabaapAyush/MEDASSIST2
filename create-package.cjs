const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create start scripts for Windows and Mac/Linux
const createStartScripts = () => {
  // Windows batch file
  const windowsContent = `@echo off
echo =========================================
echo MedAssist First Aid Application
echo =========================================
echo.
echo Installing dependencies (this may take a few minutes)...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error installing dependencies. Please ensure Node.js is installed properly.
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo Starting MedAssist application...
echo The application will open in your default browser automatically.
echo If it doesn't open, please visit http://localhost:5000 manually.
echo.
echo Press Ctrl+C to stop the application when finished.
echo =========================================
start http://localhost:5000
npm run dev
`;
  fs.writeFileSync('MedAssist.bat', windowsContent);
  console.log('Created MedAssist.bat file for easy startup on Windows');

  // Mac/Linux shell script
  const unixContent = `#!/bin/bash
echo "========================================="
echo "MedAssist First Aid Application"
echo "========================================="
echo ""
echo "Installing dependencies (this may take a few minutes)..."
npm install
if [ $? -ne 0 ]; then
    echo "Error installing dependencies. Please ensure Node.js is installed properly."
    read -p "Press Enter to exit..."
    exit 1
fi
echo ""
echo "Starting MedAssist application..."
echo "The application should be available at http://localhost:5000"
echo "Opening browser..."
echo ""
echo "Press Ctrl+C to stop the application when finished."
echo "========================================="

# Try to open browser based on platform
(sleep 2 && 
 (command -v xdg-open >/dev/null && xdg-open http://localhost:5000) || 
 (command -v open >/dev/null && open http://localhost:5000) || 
 echo "Please open http://localhost:5000 in your browser manually") &

# Start the application
npm run dev
`;
  fs.writeFileSync('start-medassist.sh', unixContent);
  console.log('Created start-medassist.sh file for easy startup on Mac/Linux');
};

// Create a README file with instructions
const createReadme = () => {
  const readmeContent = `# MedAssist First Aid Application

## How to Start the Application

### Prerequisites
- Node.js (v14 or newer) - Download from [nodejs.org](https://nodejs.org/)
- npm (usually comes with Node.js)
- An internet connection for first-time setup

### Instructions

#### Windows Users
1. Extract this archive file to a folder
2. Right-click on MedAssist.bat and select "Run as administrator" (first time only)
   - For subsequent runs, you can simply double-click the file
3. Wait for dependencies to install (may take a few minutes on first run)
4. The application will start and open in your default browser
5. If it doesn't open automatically, visit http://localhost:5000

#### Mac or Linux Users
1. Extract this archive file to a folder
2. Open a terminal/command prompt in the extracted folder
3. Make the startup script executable: \`chmod +x start-medassist.sh\`
4. Run: \`./start-medassist.sh\`
5. Visit http://localhost:5000 in your browser

### Setting up API Keys
1. Copy .env.template to .env
2. Edit the .env file and add your API keys
3. At least one API key is required for AI features to work
   - OpenAI API Key (get from [platform.openai.com](https://platform.openai.com/))
   - Gemini API Key (get from [ai.google.dev](https://ai.google.dev/))
   - DeepSeek API Key (get from DeepSeek website)

### Troubleshooting
- **Missing Dependencies Error**: Make sure Node.js is installed correctly
- **Port Already in Use**: Change the PORT value in .env file
- **Access Denied Errors**: Run as administrator (Windows) or with sudo (Mac/Linux)
- **AI Features Not Working**: Check that you've set up at least one valid API key
- **Image Upload Issues**: Ensure temp directories are writable

## Features
- First aid guidance with AI assistance
- Patient profile management
- Medical record tracking
- Multi-modal input (images, text, audio)
- Emergency contact information
- Multiple AI provider support with fallback chain

## Support
For support, contact the MedAssist team.
`;
  fs.writeFileSync('README.md', readmeContent);
  console.log('Created README.md with instructions');
};

// Create a .env file template
const createEnvTemplate = () => {
  const envContent = `# MedAssist Environment Configuration

# OpenAI API Key (Required for OpenAI features)
OPENAI_API_KEY=your_openai_api_key_here

# Gemini API Key (Optional, for Gemini AI features)
GEMINI_API_KEY=your_gemini_api_key_here

# DeepSeek API Key (Optional, for DeepSeek AI features)
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Port configuration (Default: 5000)
PORT=5000
`;
  fs.writeFileSync('.env.template', envContent);
  console.log('Created .env.template file for API key configuration');
};

// Create a ZIP-friendly .gitignore
const createGitignore = () => {
  const gitignoreContent = `# Dependency directories
node_modules/

# Build outputs
dist/
dist-electron/
*.exe

# Environment variables
.env

# Log files
*.log
npm-debug.log*

# Editor files
.vscode/
.idea/
*.swp
*.swo

# System Files
.DS_Store
Thumbs.db
`;
  fs.writeFileSync('.gitignore', gitignoreContent);
  console.log('Updated .gitignore file');
};

// Main function
const main = () => {
  console.log('Preparing MedAssist application for distribution...');
  
  try {
    // Create helper files
    createStartScripts();
    createReadme();
    createEnvTemplate();
    createGitignore();
    
    console.log('\nPreparation completed successfully!');
    console.log('\nTo create a distributable package:');
    console.log('1. Ensure you have run: npm install');
    console.log('2. Run ./create-package.sh to create the distributable archive');
    console.log('3. The file MedAssist.tar.gz will be ready for distribution');
    console.log('4. Tell users to extract the archive and follow the instructions in README.md');
    
  } catch (error) {
    console.error('Error preparing application:', error);
  }
};

// Run the main function
main();