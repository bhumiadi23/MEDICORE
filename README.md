<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f172a,50:0e7490,100:0f172a&height=200&section=header&text=MEDICORE&fontSize=72&fontColor=ffffff&fontAlignY=38&desc=Pharmaceutical%20Supply%20Chain%20on%20Blockchain&descAlignY=60&descSize=18&descColor=94e2d5&animation=fadeIn" width="100%"/>

<br/>

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?style=for-the-badge&logo=solidity&logoColor=white)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.x-f7c948?style=for-the-badge&logo=ethereum&logoColor=black)](https://hardhat.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.x-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![ethers.js](https://img.shields.io/badge/ethers.js-6.x-2535a0?style=for-the-badge&logo=ethereum&logoColor=white)](https://ethers.org/)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-5.x-4e5ee4?style=for-the-badge&logo=openzeppelin&logoColor=white)](https://openzeppelin.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-00b4d8?style=for-the-badge)](LICENSE)

<br/>

> **An end-to-end pharmaceutical supply chain integrity platform built on Ethereum.**  
> Every drug batch is minted, tracked, quality-approved, cold-chain monitored, and publicly verifiable — without a wallet.

<br/>

[![Typing SVG](https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=600&size=18&pause=1000&color=0EA5E9&center=true&vCenter=true&width=700&lines=Immutable+Drug+Provenance+on+Ethereum;Role-Based+Supply+Chain+Governance;Cold-Chain+IoT+Monitoring+%26+Violation+Alerts;Public+QR+Verification+Without+a+Wallet;Digital+Product+Passport+for+Every+Batch)](https://git.io/typing-svg)

</div>

---

## Overview

MEDICORE is a blockchain-based pharmaceutical supply chain management system. It replaces paper-based, fragmented drug tracking with a single immutable ledger where every participant — manufacturer, wholesaler, transporter, pharmacy, quality officer, regulator, and customer — operates under cryptographically enforced role permissions.

The system is built on a single Solidity smart contract (`DrugSupplyChain.sol`) deployed to a local Hardhat network (or Sepolia testnet), with a React/Vite frontend that connects via MetaMask.

**What is actually implemented and working:**

- Full on-chain drug batch lifecycle (manufacture → quality approval → supply chain → sold)
- Role-based access control enforced at the smart contract level
- Shipment creation and status tracking by transporters
- Temperature/environmental violation reporting with automatic quarantine
- Multi-party recall workflow (requires 2 approvals from different roles)
- IPFS document hash registration on-chain (mock upload in dev)
- Public drug verification without a wallet (read-only contract calls)
- Digital Product Passport with QR code generation
- IoT sensor simulator with real-time telemetry charts
- Risk/anomaly scoring engine (frontend service)
- Admin dashboard: entity management, global drug registry, recall issuance
- Analytics dashboard with network metrics (demo data)
- Transaction explorer

---

## The Problem

The global pharmaceutical supply chain loses an estimated **$200 billion annually** to counterfeit drugs. Existing systems are:

- **Fragmented** — each participant maintains their own siloed database
- **Opaque** — no single source of truth for drug provenance
- **Slow to recall** — paper-based recall processes take days or weeks
- **Unverifiable** — patients cannot confirm a drug's authenticity at point of sale

## The Solution

MEDICORE creates a **shared, tamper-proof ledger** where:

- Drug batches are minted as on-chain records with full metadata
- Every custody transfer is recorded as an immutable transaction
- Quality officers approve or reject batches before they enter the supply chain
- Temperature violations automatically quarantine affected batches
- Any person can verify a drug's authenticity by scanning a QR code — no wallet required
- Recalls require multi-party approval and execute atomically across the entire chain

---

## Supply Chain Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MEDICORE SUPPLY CHAIN                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │ MANUFACTURER │───▶│   QUALITY    │───▶│  WHOLESALER  │                  │
│  │              │    │   OFFICER    │    │              │                  │
│  │ manufactureDrug   │ approveDrug  │    │supplyToRetailer                 │
│  │ QUALITY_PENDING   │ AVAILABLE    │    │              │                  │
│  └──────────────┘    └──────────────┘    └──────┬───────┘                  │
│                                                  │                         │
│                                          ┌───────▼───────┐                 │
│                                          │  TRANSPORTER  │                 │
│                                          │               │                 │
│                                          │createShipment │                 │
│                                          │  IN_TRANSIT   │                 │
│                                          └───────┬───────┘                 │
│                                                  │                         │
│                                          ┌───────▼───────┐                 │
│                                          │   PHARMACY    │                 │
│                                          │  (Retailer)   │                 │
│                                          │supplyToCustomer                 │
│                                          └───────┬───────┘                 │
│                                                  │                         │
│                                          ┌───────▼───────┐                 │
│                                          │   CUSTOMER    │                 │
│                                          │  verifyDrug   │                 │
│                                          │    SOLD       │                 │
│                                          └───────────────┘                 │
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐                                      │
│  │  REGULATOR   │    │ SUPER ADMIN  │  ← Can suspend/activate any entity   │
│  │ requestRecall│    │ recallDrug   │  ← Can issue global recalls           │
│  └──────────────┘    └──────────────┘                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Smart Contract Architecture

```
DrugSupplyChain.sol
│
├── Enums
│   ├── Role              (None, Manufacturer, Wholesaler, Retailer,
│   │                      Customer, Transporter, Regulator, QualityOfficer)
│   ├── DrugStatus        (CREATED → QUALITY_PENDING → QUALITY_APPROVED →
│   │                      AVAILABLE → IN_TRANSIT → DELIVERED → FLAGGED →
│   │                      QUARANTINED → UNDER_INVESTIGATION → RELEASED →
│   │                      RECALLED → EXPIRED → SOLD)
│   ├── ShipmentStatus    (PREPARING → DISPATCHED → IN_TRANSIT →
│   │                      ARRIVED → DELIVERED → DELAYED → QUARANTINED)
│   └── RecallStatus      (REQUESTED → UNDER_REVIEW → APPROVED → ACTIVE → COMPLETED)
│
├── Structs
│   ├── Entity            (name, id, role, wallet, isRegistered, isActive)
│   ├── DrugBatch         (full metadata + cold-chain params + IPFS hash)
│   ├── DrugTransaction   (from/to, role, quantity, timestamp, wallets)
│   ├── Shipment          (route, transporter, departure, arrival, status)
│   ├── QualityApproval   (officer, approved, comments, timestamp)
│   ├── RecallRequest     (multi-party approval counter, status)
│   ├── EnvironmentalViolation (temp, humidity, shipment, reporter)
│   └── Document          (docType, IPFS CID, uploader, timestamp)
│
├── Access Control
│   ├── onlyOwner         → Super Admin operations
│   ├── onlyRole(Role)    → Role-specific functions
│   ├── onlyRegistered    → Any registered entity
│   └── onlyActive        → Non-suspended entities only
│
└── Key Functions
    ├── registerEntity / suspendEntity / activateEntity
    ├── manufactureDrug (full + simplified overload)
    ├── approveDrug / rejectDrug
    ├── supplyToWholesaler / supplyToRetailer / supplyToCustomer
    ├── createShipment / updateShipmentStatus / completeShipment
    ├── reportEnvironmentalViolation
    ├── requestRecall / approveRecall (2-of-N multi-party)
    ├── addDocument (IPFS CID registration)
    └── verifyDrug (public, no wallet required)
```

---

## Role-Based Architecture

| Role | Contract Enum | Key Permissions |
|------|--------------|-----------------|
| **Super Admin** | Contract `owner` | Suspend/activate entities, issue global recalls |
| **Manufacturer** | `Role.Manufacturer` | Manufacture drug batches, supply to wholesalers, request recalls |
| **Wholesaler** | `Role.Wholesaler` | Receive from manufacturers, supply to retailers/pharmacies |
| **Transporter** | `Role.Transporter` | Create shipments, update transit status, report violations |
| **Pharmacy** | `Role.Retailer` | Receive from wholesalers, dispense to customers |
| **Quality Officer** | `Role.QualityOfficer` | Approve or reject batches in `QUALITY_PENDING` state |
| **Regulator** | `Role.Regulator` | Monitor network, request and approve recalls |
| **Customer** | `Role.Customer` | Receive drugs, verify authenticity via QR |

Each role is enforced at the Solidity level via the `onlyRole` modifier. No frontend-only access control.

---

## Implemented Features

### Drug Batch Lifecycle
Every drug batch is created with full pharmaceutical metadata:
- Generic name, brand name, batch number, MRP, dosage, storage requirements, country of origin
- Manufacturing and expiry dates (expiry enforced on-chain)
- Cold-chain temperature bounds (`minTemp`, `maxTemp`)
- IPFS certificate hash for off-chain document anchoring
- Status transitions enforced by the contract state machine

### Quality Control Workflow
```
manufactureDrug() → status: QUALITY_PENDING
     │
     ├── approveDrug()  → status: QUALITY_APPROVED → AVAILABLE
     └── rejectDrug()   → status: FLAGGED
```
Quality Officers cannot approve their own batches. Approval is recorded with officer ID, comments, and timestamp.

### Cold-Chain Monitoring & IoT Simulator
The frontend includes a live IoT sensor simulator (`IoTSimulator.jsx`) that:
- Streams temperature, humidity, and GPS readings at configurable intervals
- Supports scenario injection: HIGH_TEMP, LOW_TEMP, HUMIDITY_VIOLATION, GPS_DEVIATION
- Renders real-time telemetry charts via Recharts
- Triggers `reportEnvironmentalViolation()` on the contract when a violation is detected
- Automatically transitions the drug batch to `QUARANTINED` status on-chain

### Temperature Violation Workflow
```
reportEnvironmentalViolation(drugId, shipmentId, recordedTemp)
     │
     ├── Records EnvironmentalViolation struct on-chain
     ├── Emits TemperatureViolation event
     ├── Transitions drug → FLAGGED → QUARANTINED
     └── Emits DrugFlagged + DrugQuarantined events
```

### Multi-Party Recall Workflow
Recalls require approval from at least 2 different authorized roles (Manufacturer, QualityOfficer, or Regulator):
```
requestRecall(drugId, reason)   → RecallStatus.REQUESTED  (approvalCount = 1)
approveRecall(drugId)           → approvalCount++
                                  if count >= 2 → _executeRecall()
                                                → isRecalled = true
                                                → status = RECALLED
                                                → DrugRecalled event
```

### Public Drug Verification (No Wallet Required)
`DrugVerification.jsx` uses a read-only provider to call `verifyDrug()` without MetaMask. Returns:
- Authenticity status, drug name, manufacturer, dates, recall status, current chain status
- Supply chain history timeline
- Link to full Digital Product Passport

### Digital Product Passport
`DrugPassport.jsx` renders a printable passport for any drug batch:
- Full manufacturing details and wallet addresses
- Supply chain provenance timeline
- Storage requirements (temperature, humidity, light)
- QR code generation for the verification URL
- IPFS document links (CoA, Origin Declaration)

### IPFS Document Registration
`ipfs.js` provides `uploadFileToIPFS()` and `getIPFSUrl()`. In development, it generates mock CIDs. The CID is stored on-chain via `addDocument()`. In production, replace with Pinata or web3.storage.

### Risk & Anomaly Detection
`anomalyDetection.js` computes a risk score (0–100) from:
- Cold-chain violation count
- Drug recall status
- QR scan frequency anomalies
- Returns risk level: LOW / MEDIUM / HIGH / CRITICAL

### Analytics Dashboard
Network-wide metrics with Recharts visualizations:
- Drug status distribution (pie chart)
- Inventory by role (bar chart)
- Network activity trend — new batches vs. QR verifications (line chart)
- Currently uses demo data; designed to be wired to live contract events

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Solidity 0.8.20, OpenZeppelin ReentrancyGuard |
| Blockchain Dev | Hardhat 2.x, hardhat-toolbox |
| Testnet | Sepolia (configurable via `.env`) |
| Frontend Framework | React 18, Vite 5 |
| Styling | Tailwind CSS 3, custom glassmorphism components |
| Animations | Framer Motion |
| Blockchain Client | ethers.js 6 |
| Charts | Recharts |
| QR Codes | qrcode.react |
| Notifications | react-hot-toast |
| Icons | Lucide React |
| IPFS (dev mock) | Custom mock → replace with Pinata SDK |

---

## Project Structure

```
Drug_Supply_Chain/
│
├── blockchain/                     # Hardhat project
│   ├── contracts/
│   │   └── DrugSupplyChain.sol     # Single contract, ~700 lines
│   ├── scripts/
│   │   ├── deploy.js               # Deployment script
│   │   ├── seed.js                 # Demo data seeder
│   │   ├── register-user.js        # Entity registration helper
│   │   ├── fund-and-register.js    # Fund + register in one step
│   │   ├── auto-approve.js         # Auto quality approval helper
│   │   └── test-manufacture.js     # Manufacturing test script
│   ├── hardhat.config.js           # Hardhat + Sepolia config
│   ├── deployments.json            # Deployed contract address
│   └── .env.example                # Environment variable template
│
├── frontend/                       # React/Vite application
│   ├── public/
│   │   ├── MediCore-bg.mp4         # Hero background video
│   │   ├── deployments.json        # Contract address for frontend
│   │   └── *-bg.jpg                # Role-specific background images
│   ├── src/
│   │   ├── blockchain/
│   │   │   ├── contract.js         # Contract factory (read-only + signer)
│   │   │   └── abi.js              # Contract ABI
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Timeline.jsx        # Supply chain event timeline
│   │   │   ├── QRCodeGenerator.jsx
│   │   │   ├── DataTable.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   └── NotificationCenter.jsx
│   │   ├── context/
│   │   │   ├── Web3Context.jsx     # MetaMask + contract connection
│   │   │   └── NotificationContext.jsx
│   │   ├── hooks/
│   │   │   ├── useContractData.js
│   │   │   └── useTransaction.js   # Transaction execution + toast feedback
│   │   ├── layouts/
│   │   │   ├── DashboardLayout.jsx # Authenticated layout
│   │   │   └── PublicLayout.jsx    # Public layout
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── ConnectWallet.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── DrugVerification.jsx    # Public, no wallet
│   │   │   ├── DrugTracking.jsx
│   │   │   ├── DrugPassport.jsx        # Digital Product Passport
│   │   │   ├── IoTSimulator.jsx        # Cold-chain telemetry simulator
│   │   │   ├── Analytics.jsx           # Network analytics
│   │   │   ├── TransactionExplorer.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── ManufacturerDashboard.jsx
│   │   │   ├── WholesalerDashboard.jsx
│   │   │   ├── RetailerDashboard.jsx
│   │   │   ├── CustomerDashboard.jsx
│   │   │   ├── TransporterDashboard.jsx
│   │   │   ├── QualityOfficerDashboard.jsx
│   │   │   └── RegulatorDashboard.jsx
│   │   ├── services/
│   │   │   ├── anomalyDetection.js     # Risk scoring engine
│   │   │   ├── iotSimulator.js         # IoT reading generator
│   │   │   ├── ipfs.js                 # IPFS upload (mock in dev)
│   │   │   └── scanTracking.js
│   │   └── utils/
│   │       └── helpers.js              # Formatters, status labels, role labels
│   └── vite.config.js
│
├── .gitignore
├── START_DEMO.bat                  # Windows demo launcher
└── README.md
```

---

## Installation & Local Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [MetaMask](https://metamask.io/) browser extension
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/bhumiadi23/MEDICORE.git
cd MEDICORE
```

### 2. Set Up the Blockchain (Hardhat)

```bash
cd blockchain
npm install
```

Copy the environment template:

```bash
cp .env.example .env
```

`.env.example` contains:
```
SEPOLIA_RPC_URL=
DEPLOYER_PRIVATE_KEY=
ETHERSCAN_API_KEY=
```

For local development, these can be left empty.

### 3. Start the Local Hardhat Node

Open a terminal and keep it running:

```bash
npx hardhat node
```

This starts a local Ethereum node at `http://127.0.0.1:8545` with 20 pre-funded test accounts.

### 4. Deploy the Contract

In a second terminal:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

This deploys `DrugSupplyChain.sol` and writes the contract address to `deployments.json`. The frontend reads this file automatically.

### 5. (Optional) Seed Demo Data

```bash
npx hardhat run scripts/seed.js --network localhost
```

Registers demo entities (manufacturer, wholesaler, retailer, transporter, quality officer, regulator, customer) and manufactures sample drug batches.

### 6. Set Up the Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### 7. Connect MetaMask

1. Add a custom network in MetaMask:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency: `ETH`

2. Import a test account using one of the private keys printed by `npx hardhat node`.

3. Navigate to `/connect` and connect your wallet.

4. Navigate to `/register` to register your wallet with a role.

---

## Deploying to Sepolia Testnet

1. Get Sepolia ETH from a faucet (e.g. [sepoliafaucet.com](https://sepoliafaucet.com/))
2. Set `SEPOLIA_RPC_URL` and `DEPLOYER_PRIVATE_KEY` in `blockchain/.env`
3. Deploy:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

4. Update `frontend/public/deployments.json` with the new contract address.

---

## Demo Scenarios

### Scenario 1: Full Supply Chain Flow
1. Connect as **Manufacturer** → manufacture a drug batch
2. Connect as **Quality Officer** → approve the batch
3. Connect as **Manufacturer** → supply to wholesaler
4. Connect as **Wholesaler** → supply to retailer
5. Connect as **Retailer** → supply to customer
6. Open `/verify/<drugId>` in a new tab (no wallet) → confirm authenticity

### Scenario 2: Cold-Chain Violation
1. Navigate to `/iot`
2. Enter a drug batch ID and shipment ID
3. Click **Inject High Temp (>8°C)**
4. Observe the violation toast and the drug status change to `QUARANTINED`

### Scenario 3: Multi-Party Recall
1. Connect as **Manufacturer** → call `requestRecall` on a batch
2. Connect as **Regulator** → call `approveRecall` on the same batch
3. Observe `RecallStatus.ACTIVE` and `DrugStatus.RECALLED`
4. Open `/verify/<drugId>` → confirm the recall warning is displayed

### Scenario 4: Public Verification
1. Navigate to `/verify` (no MetaMask required)
2. Enter any drug batch ID
3. View full provenance, status, and supply chain history

---

## Roadmap / Planned Features

The following features are architecturally designed but not yet fully implemented:

- **Real IPFS integration** — replace mock `ipfs.js` with Pinata SDK or web3.storage
- **Live analytics** — wire `Analytics.jsx` to on-chain event indexing (The Graph or custom indexer)
- **Oracle integration** — connect IoT simulator to a Chainlink oracle for on-chain violation reporting
- **Batch genealogy graph** — visual DAG of drug batch lineage across the supply chain
- **Interactive memory map** — geographic visualization of shipment routes
- **Sepolia testnet deployment** — public demo deployment with persistent state
- **Mobile QR scanner** — native camera integration for in-pharmacy verification
- **Email/SMS recall alerts** — off-chain notification layer for recall events
- **Multi-signature admin** — replace single `owner` with a Gnosis Safe multisig
- **Expiry auto-enforcement** — Chainlink Automation to flag expired batches on-chain

---

## Security Model

| Mechanism | Implementation |
|-----------|---------------|
| Reentrancy protection | `ReentrancyGuard` from OpenZeppelin on all state-changing functions |
| Role enforcement | `onlyRole(Role)` modifier checked against `entityByWallet` mapping |
| Suspension | `onlyActive` modifier — suspended entities cannot call any function |
| Recall integrity | Multi-party approval (2-of-N), different roles required |
| Expiry enforcement | `_isDrugExpired()` checked before every supply operation |
| Recall immutability | Once `isRecalled = true`, status cannot revert |
| Ownership transfer | Not implemented — owner is set at construction (single deployer) |

---

## Blockchain Transaction Lifecycle

```
User Action (Frontend)
        │
        ▼
useTransaction hook
        │
        ├── contract.connect(signer)
        ├── contract[method](...args)
        │
        ▼
MetaMask Signature Prompt
        │
        ▼
Transaction broadcast → Hardhat/Sepolia mempool
        │
        ▼
Block confirmation
        │
        ├── Event emitted (e.g. DrugManufactured)
        ├── State updated in contract storage
        └── Frontend re-fetches data → UI updates
```

---

## Academic Disclaimer

> MEDICORE is a research and academic prototype demonstrating the application of blockchain technology to pharmaceutical supply chain integrity. It is **not** a production system and has **not** undergone a formal security audit. Do not use this software to manage real pharmaceutical products or patient data. The smart contract has not been audited by a third party. All test accounts and private keys in this repository are for local development only and contain no real value.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f172a,50:0e7490,100:0f172a&height=120&section=footer&text=Built%20with%20%E2%9D%A4%EF%B8%8F%20on%20Ethereum&fontSize=18&fontColor=94e2d5&fontAlignY=65&animation=fadeIn" width="100%"/>

**MEDICORE** · Pharmaceutical Blockchain Infrastructure · Academic Prototype

[![GitHub](https://img.shields.io/badge/GitHub-bhumiadi23-0ea5e9?style=flat-square&logo=github)](https://github.com/bhumiadi23)

</div>
