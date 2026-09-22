# DrugChain 2.0
**Blockchain-Powered Pharmaceutical Traceability & Safety Platform**

DrugChain 2.0 is an enterprise-grade blockchain application designed to secure pharmaceutical supply chains. It tracks drugs from manufacture to the consumer, incorporating quality checks, cold-chain temperature monitoring, IPFS document storage, QR code product passports, and advanced recall/quarantine mechanics.

## 🌟 Key Features
- **8 Distinct Roles:** SuperAdmin, Manufacturer, Wholesaler, Transporter, Retailer, Customer, Regulator, and Quality Officer.
- **Digital Product Passport:** Every drug batch gets a unique identity, QR code, and IPFS-backed documents (manufacturing certs, lab reports).
- **IoT & Cold-Chain Monitoring:** Simulate and track temperature/humidity violations. Automatic flagging and quarantining for temperature excursions.
- **Advanced State Machine:** Strict enforcement of drug lifecycles (e.g., CREATED → QUALITY_APPROVED → IN_TRANSIT → DELIVERED).
- **Multi-Signature Recalls:** 2-of-3 consensus required (Manufacturer + Quality Officer + Regulator) for high-severity recalls.
- **AI/ML Anomaly Detection:** Real-time risk analysis for shipments based on route, temperature, and QR scan frequency.
- **Public Verification:** Consumers can scan QR codes to verify authenticity without needing a Web3 wallet.

## 🚀 Quick Start (Demo Mode)

### 1. Start the Local Blockchain
Open a terminal in the `blockchain` directory:
```bash
cd blockchain
npm install
npx hardhat node
```

### 2. Deploy and Seed Data
In a second terminal, deploy the contract and run the automated seed script to populate the network with demo entities, drugs, and scenarios:
```bash
cd blockchain
npm run deploy
npm run seed
```

### 3. Start the Frontend
In a third terminal, launch the React application:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

## 👥 Demo Accounts (Localhost)
Make sure your MetaMask is connected to `Localhost 8545` (Chain ID: `31337`). Use the following Hardhat test accounts:

1. **Admin / Owner** - Account #0
2. **Manufacturer** (ABC Pharmaceuticals) - Account #1
3. **Wholesaler** (XYZ Wholesalers) - Account #2
4. **Retailer** (CityCare Pharmacy) - Account #3
5. **Customer** (Rahul Sharma) - Account #4
6. **Transporter** (FastMed Logistics) - Account #5
7. **Regulator** (Drug Regulatory Authority) - Account #6
8. **Quality Officer** (Dr. Priya Mehta) - Account #7

## 🧪 Demo Scenarios (Pre-loaded via Seed Script)
- **Authentic Flow:** Search `PARA-2026-001` to see a perfectly executed supply chain.
- **Recalled Batch:** Search `AMOX-2026-001` to see the red warnings for an active recall.
- **Cold-Chain Violation:** Login as Transporter or search `METF-2026-001` to see a quarantined batch due to a temperature excursion (11.4°C).
- **Expiring Soon:** Search `VACC-2026-001` to see the expiration warnings.

## 🛠 Tech Stack
- **Smart Contracts:** Solidity 0.8.20, Hardhat, OpenZeppelin
- **Frontend:** React 18, Vite, Tailwind CSS, ethers.js v6
- **Visuals & Charts:** Recharts, Framer Motion, Lucide React, react-leaflet
- **Storage:** IPFS (via Pinata abstraction)
