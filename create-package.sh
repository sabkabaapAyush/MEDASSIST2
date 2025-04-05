#!/bin/bash
echo "Creating MedAssist package for distribution..."

# Run the preparation script
node create-package.cjs

# Create a temporary folder for distribution files
mkdir -p dist_package

# Copy all necessary files
echo "Copying files to dist_package folder..."
cp -r client dist_package/
cp -r server dist_package/
cp -r shared dist_package/
cp -r public dist_package/
cp package.json dist_package/
cp package-lock.json dist_package/
cp tsconfig.json dist_package/
cp vite.config.ts dist_package/
cp tailwind.config.ts dist_package/
cp postcss.config.js dist_package/
cp drizzle.config.ts dist_package/
cp theme.json dist_package/
cp MedAssist.bat dist_package/
cp start-medassist.sh dist_package/
cp README.md dist_package/
cp .env.template dist_package/

# Make shell script executable
chmod +x dist_package/start-medassist.sh

# Create a tar.gz file (more universally available than zip)
echo "Creating archive..."
tar -czvf MedAssist.tar.gz -C dist_package .

echo "Package created: MedAssist.tar.gz"
echo "You can now download this file and share it with users."
echo "Done!"