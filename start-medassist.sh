#!/bin/bash
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
