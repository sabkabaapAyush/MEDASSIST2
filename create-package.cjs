const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create a start script that can be used on Windows
const createStartScript = () => {
  const startContent = `@echo off
echo Starting MedAssist...
npm run dev
`;
  fs.writeFileSync('MedAssist.bat', startContent);
  console.log('Created MedAssist.bat file for easy startup on Windows');
};

// Create a README file with instructions
const createReadme = () => {
  const readmeContent = `# MedAssist First Aid Application

## How to Start the Application

### Prerequisites
- Node.js (v14 or newer)
- npm (usually comes with Node.js)

### Instructions

#### Windows Users
1. Extract this ZIP file to a folder
2. Double-click the MedAssist.bat file
3. The application will start and open in your default browser
4. If it doesn't open automatically, visit http://localhost:5000

#### Mac or Linux Users
1. Extract this ZIP file to a folder
2. Open a terminal/command prompt in the extracted folder
3. Run: npm install (first time only)
4. Run: npm run dev
5. Visit http://localhost:5000 in your browser

## Features
- First aid guidance with AI assistance
- Patient profile management
- Medical record tracking
- Multi-modal input (images, text, audio)
- Emergency contact information

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
    createStartScript();
    createReadme();
    createEnvTemplate();
    createGitignore();
    
    console.log('\nPreparation completed successfully!');
    console.log('\nTo create a distributable package:');
    console.log('1. Ensure you have run: npm install');
    console.log('2. Zip all files in this directory (except node_modules)');
    console.log('3. Tell users to extract the ZIP and follow the instructions in README.md');
    
  } catch (error) {
    console.error('Error preparing application:', error);
  }
};

// Run the main function
main();