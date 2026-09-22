@echo off
echo Starting DrugChain 2.0 Local Environment...

echo Starting Hardhat Node...
start cmd /k "cd blockchain && npx hardhat node"

timeout /t 5 /nobreak > NUL

echo Deploying Contracts and Seeding Data...
start cmd /k "cd blockchain && npx hardhat run scripts/deploy.js --network localhost && npx hardhat run scripts/seed.js --network localhost && echo. && echo DEMO DATA LOADED! You can minimize this window."

echo Starting Frontend Server...
start cmd /k "cd frontend && npm run dev"

echo.
echo =======================================================
echo EVERYTHING IS RUNNING!
echo Please open your browser to: http://localhost:5173
echo =======================================================
pause
