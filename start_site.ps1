Write-Host "Checking libraries..."
npm install
Write-Host "Opening webpage..."
Start-Process "http://localhost:58080/"
Write-Host "Starting site..."
npm run dev
