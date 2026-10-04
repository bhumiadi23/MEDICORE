# MEDICORE Reproducibility Guide

## System Requirements
- Node.js: v18+
- Hardhat: v2.22.x
- Solidity: ^0.8.20
- Database: SQLite

## Instructions

### 1. Blockchain Network Setup
```bash
cd blockchain
npx hardhat node
```

### 2. Deploy and Seed
```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
npx hardhat run scripts/seed.js --network localhost
```

### 3. Start the Backend API (Anomaly Engine)
```bash
cd backend
npm install
npm start
```

### 4. Start the Frontend Dashboards
```bash
cd frontend
npm install
npm run dev
```

### 5. Reproducing Experimental Results (Research Data)
```bash
cd blockchain
npx hardhat run scripts/run_experiments.js --network localhost
```

### 6. Regenerating Graphs
```bash
python research/generate_graphs.py
```
