<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:020617,40:0c4a6e,80:0e7490,100:020617&height=220&section=header&text=MEDICORE&fontSize=80&fontColor=ffffff&fontAlignY=40&desc=Pharmaceutical+Supply+Chain+%E2%80%94+On+Blockchain&descAlignY=62&descSize=17&descColor=7dd3fc&animation=fadeIn" width="100%"/>

<br/>

<!-- Animated typing tagline -->
[![Typing SVG](https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=16&pause=1200&color=38BDF8&center=true&vCenter=true&width=750&lines=Every+drug+batch+minted+%E2%80%94+tracked+%E2%80%94+verified+on-chain;Role-enforced+access+control+in+Solidity;Cold-chain+IoT+monitoring+%2B+auto-quarantine;Public+QR+verification+%E2%80%94+no+wallet+needed;Multi-party+recall+workflow+%E2%80%94+2-of-N+approval)](https://git.io/typing-svg)

<br/>

<!-- Tech badges -->
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-343434?style=flat-square&logo=solidity&logoColor=white)](https://soliditylang.org)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.x-f7c948?style=flat-square&logo=ethereum&logoColor=black)](https://hardhat.org)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![ethers.js](https://img.shields.io/badge/ethers.js-6-2535a0?style=flat-square&logo=ethereum&logoColor=white)](https://ethers.org)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-5-4e5ee4?style=flat-square&logo=openzeppelin&logoColor=white)](https://openzeppelin.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-0ea5e9?style=flat-square)](LICENSE)

<br/>

<!-- Quick stat pills -->
![](https://img.shields.io/badge/Smart_Contract-1_file_·_~700_lines-0e7490?style=for-the-badge)
![](https://img.shields.io/badge/Drug_Statuses-13_states-7c3aed?style=for-the-badge)
![](https://img.shields.io/badge/Roles-8_enforced_on--chain-0f766e?style=for-the-badge)
![](https://img.shields.io/badge/Recall-2--of--N_multi--party-dc2626?style=for-the-badge)

</div>

---

## 🗺️ What is MEDICORE?

A single Solidity smart contract + React/Vite frontend that puts the **entire pharmaceutical supply chain on Ethereum**.

Every drug batch is minted on-chain, quality-approved, cold-chain monitored, and publicly verifiable by scanning a QR code — **no wallet required for verification**.

<details>
<summary><b>🔴 The Problem (click to expand)</b></summary>

<br/>

> The global pharma supply chain loses **~$200 billion/year** to counterfeit drugs.

| Pain Point | Reality Today |
|---|---|
| 🗂️ Fragmented | Every participant has their own siloed database |
| 🌫️ Opaque | No single source of truth for drug provenance |
| 🐢 Slow recalls | Paper-based processes take days or weeks |
| ❓ Unverifiable | Patients can't confirm authenticity at point of sale |

</details>

<details>
<summary><b>✅ The Solution (click to expand)</b></summary>

<br/>

MEDICORE creates a **shared, tamper-proof ledger** where:

- Drug batches are minted as on-chain records with full metadata
- Every custody transfer is an immutable transaction
- Quality officers approve/reject batches before they enter the chain
- Temperature violations automatically quarantine affected batches
- Recalls require 2-of-N multi-party approval and execute atomically
- Anyone can verify a drug by scanning a QR code — no MetaMask needed

</details>

---

## ⚡ Feature Snapshot

| Feature | Status | Where |
|---|---|---|
| Drug batch lifecycle (13 states) | ✅ On-chain | `DrugSupplyChain.sol` |
| Role-based access (8 roles) | ✅ On-chain | `onlyRole` modifier |
| Quality approve / reject | ✅ On-chain | `approveDrug` / `rejectDrug` |
| Shipment tracking | ✅ On-chain | `createShipment` / `updateShipmentStatus` |
| Cold-chain violation → auto-quarantine | ✅ On-chain | `reportEnvironmentalViolation` |
| Multi-party recall (2-of-N) | ✅ On-chain | `requestRecall` / `approveRecall` |
| IPFS document hash anchoring | ✅ On-chain (mock upload in dev) | `addDocument` |
| Public drug verification (no wallet) | ✅ Frontend | `DrugVerification.jsx` |
| Digital Product Passport + QR | ✅ Frontend | `DrugPassport.jsx` |
| IoT sensor simulator + live charts | ✅ Frontend | `IoTSimulator.jsx` |
| Risk / anomaly scoring | ✅ Frontend | `anomalyDetection.js` |
| Admin dashboard | ✅ Frontend | `AdminDashboard.jsx` |
| Analytics (demo data) | ✅ Frontend | `Analytics.jsx` |
| Real IPFS (Pinata) | 🔲 Roadmap | — |
| Live analytics indexing (The Graph) | 🔲 Roadmap | — |
| Chainlink oracle for IoT | 🔲 Roadmap | — |

---

## 🔄 Supply Chain Flow

```
  ┌──────────────┐     quality      ┌──────────────┐
  │ MANUFACTURER │ ──────────────▶  │   QUALITY    │
  │              │  manufactureDrug │   OFFICER    │
  │  QUALITY_    │                  │  approveDrug │
  │  PENDING     │◀─────────────────│  AVAILABLE   │
  └──────┬───────┘                  └──────────────┘
         │ supplyToWholesaler
         ▼
  ┌──────────────┐   createShipment  ┌──────────────┐
  │  WHOLESALER  │ ────────────────▶ │  TRANSPORTER │
  │              │                   │  IN_TRANSIT  │
  └──────┬───────┘                   └──────┬───────┘
         │ supplyToRetailer                  │ completeShipment
         ▼                                  ▼
  ┌──────────────┐                   ┌──────────────┐
  │   PHARMACY   │ supplyToCustomer  │   CUSTOMER   │
  │  (Retailer)  │ ────────────────▶ │  verifyDrug  │
  └──────────────┘                   │    SOLD ✓    │
                                     └──────────────┘

  ┌──────────────┐  ┌──────────────┐
  │  REGULATOR   │  │ SUPER ADMIN  │  ← suspend / activate entities
  │ requestRecall│  │  recallDrug  │  ← global recall override
  └──────────────┘  └──────────────┘
```

---

## 🏗️ Smart Contract at a Glance

<details>
<summary><b>View full contract architecture</b></summary>

```
DrugSupplyChain.sol
│
├── Enums
│   ├── Role          None | Manufacturer | Wholesaler | Retailer
│   │                 Customer | Transporter | Regulator | QualityOfficer
│   │
│   ├── DrugStatus    CREATED → QUALITY_PENDING → QUALITY_APPROVED
│   │                 → AVAILABLE → IN_TRANSIT → DELIVERED
│   │                 → FLAGGED → QUARANTINED → RELEASED
│   │                 → RECALLED → EXPIRED → SOLD
│   │
│   ├── ShipmentStatus  PREPARING → DISPATCHED → IN_TRANSIT
│   │                   → ARRIVED → DELIVERED → DELAYED → QUARANTINED
│   │
│   └── RecallStatus  REQUESTED → UNDER_REVIEW → APPROVED → ACTIVE → COMPLETED
│
├── Structs
│   ├── Entity              name, id, role, wallet, isRegistered, isActive
│   ├── DrugBatch           full metadata + cold-chain bounds + IPFS hash
│   ├── DrugTransaction     from/to, role, quantity, timestamp, wallets
│   ├── Shipment            route, transporter, departure, arrival, status
│   ├── QualityApproval     officer, approved, comments, timestamp
│   ├── RecallRequest       multi-party approval counter + status
│   ├── EnvironmentalViolation  temp, bounds, shipment, reporter
│   └── Document            docType, IPFS CID, uploader, timestamp
│
├── Access Modifiers
│   ├── onlyOwner           Super Admin only
│   ├── onlyRole(Role)      Role-specific functions
│   ├── onlyRegistered      Any registered entity
│   └── onlyActive          Non-suspended entities only
│
└── Key Functions
    ├── registerEntity / suspendEntity / activateEntity
    ├── manufactureDrug  (full overload + simplified overload)
    ├── approveDrug / rejectDrug
    ├── supplyToWholesaler / supplyToRetailer / supplyToCustomer
    ├── createShipment / updateShipmentStatus / completeShipment
    ├── reportEnvironmentalViolation
    ├── requestRecall / approveRecall  (2-of-N)
    ├── addDocument  (IPFS CID on-chain)
    └── verifyDrug   (public read — no wallet)
```

</details>

---

## 👥 Roles

| Role | Solidity Enum | Can Do |
|---|---|---|
| 🔑 Super Admin | `owner` | Suspend/activate entities, global recalls |
| 🏭 Manufacturer | `Role.Manufacturer` | Mint batches, supply to wholesalers, request recalls |
| 📦 Wholesaler | `Role.Wholesaler` | Receive from manufacturers, supply to pharmacies |
| 🚚 Transporter | `Role.Transporter` | Create shipments, update status, report violations |
| 💊 Pharmacy | `Role.Retailer` | Receive from wholesalers, dispense to customers |
| 🔬 Quality Officer | `Role.QualityOfficer` | Approve/reject `QUALITY_PENDING` batches |
| 🏛️ Regulator | `Role.Regulator` | Monitor network, request/approve recalls |
| 👤 Customer | `Role.Customer` | Receive drugs, verify via QR |

> All roles enforced in Solidity via `onlyRole`. Zero frontend-only access control.

---

## 🔬 Key Workflows

<details>
<summary><b>🧪 Quality Control</b></summary>

```
manufactureDrug()  →  QUALITY_PENDING
        │
        ├── approveDrug()   →  QUALITY_APPROVED  →  AVAILABLE
        └── rejectDrug()    →  FLAGGED
```
Approval recorded with officer ID, comments, and block timestamp.

</details>

<details>
<summary><b>🌡️ Cold-Chain Violation → Auto-Quarantine</b></summary>

```
reportEnvironmentalViolation(drugId, shipmentId, recordedTemp)
        │
        ├── Stores EnvironmentalViolation struct on-chain
        ├── Emits TemperatureViolation event
        ├── drug  →  FLAGGED  →  QUARANTINED
        └── Emits DrugFlagged + DrugQuarantined events
```
The IoT Simulator (`/iot`) streams live temperature/humidity/GPS readings and injects HIGH_TEMP, LOW_TEMP, HUMIDITY_VIOLATION, or GPS_DEVIATION scenarios.

</details>

<details>
<summary><b>🚨 Multi-Party Recall (2-of-N)</b></summary>

```
requestRecall(drugId, reason)   →  REQUESTED   (approvalCount = 1)
approveRecall(drugId)           →  approvalCount++
                                   count ≥ 2  →  _executeRecall()
                                               →  isRecalled = true
                                               →  RECALLED
                                               →  DrugRecalled event
```
Requires 2 different authorized roles: Manufacturer, QualityOfficer, or Regulator.

</details>

<details>
<summary><b>🔍 Public Verification (No Wallet)</b></summary>

`DrugVerification.jsx` uses a **read-only provider** — no MetaMask needed.

Returns: authenticity status · drug name · manufacturer · dates · recall status · chain status · supply history timeline → link to full Digital Product Passport.

</details>

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Smart Contract | Solidity 0.8.20 · OpenZeppelin ReentrancyGuard |
| Blockchain Dev | Hardhat 2.x · hardhat-toolbox |
| Testnet | Sepolia (via `.env`) |
| Frontend | React 18 · Vite 5 |
| Styling | Tailwind CSS 3 · Framer Motion |
| Blockchain Client | ethers.js 6 |
| Charts | Recharts |
| QR Codes | qrcode.react |
| Notifications | react-hot-toast · Lucide React |
| IPFS | Mock in dev → replace with Pinata SDK |

---

## 🚀 Quick Start

<details>
<summary><b>Step-by-step local setup</b></summary>

### Prerequisites
- Node.js v18+
- MetaMask browser extension

### 1 · Clone
```bash
git clone https://github.com/bhumiadi23/MEDICORE.git
cd MEDICORE
```

### 2 · Install & configure blockchain
```bash
cd blockchain
npm install
cp .env.example .env   # fill in only for Sepolia; leave empty for local
```

### 3 · Start local node (keep running)
```bash
npx hardhat node
```

### 4 · Deploy contract
```bash
# new terminal
npx hardhat run scripts/deploy.js --network localhost
```

### 5 · (Optional) Seed demo data
```bash
npx hardhat run scripts/seed.js --network localhost
```

### 6 · Start frontend
```bash
cd ../frontend
npm install
npm run dev
# → http://localhost:5173
```

### 7 · Connect MetaMask
| Field | Value |
|---|---|
| Network Name | Hardhat Local |
| RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Currency | ETH |

Import a private key from the `npx hardhat node` output, then go to `/connect` → `/register`.

</details>

<details>
<summary><b>Deploy to Sepolia testnet</b></summary>

```bash
# blockchain/.env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<KEY>
DEPLOYER_PRIVATE_KEY=<your_key>

npx hardhat run scripts/deploy.js --network sepolia
# then update frontend/public/deployments.json with the new address
```

</details>

---

## 🎬 Demo Scenarios

<details>
<summary><b>Scenario 1 — Full supply chain flow</b></summary>

1. Connect as **Manufacturer** → manufacture a batch
2. Connect as **Quality Officer** → approve it
3. Connect as **Manufacturer** → supply to wholesaler
4. Connect as **Wholesaler** → supply to retailer
5. Connect as **Retailer** → supply to customer
6. Open `/verify/<drugId>` (no wallet) → ✅ authentic

</details>

<details>
<summary><b>Scenario 2 — Cold-chain violation</b></summary>

1. Go to `/iot`
2. Enter a batch ID and shipment ID
3. Click **Inject High Temp (>8°C)**
4. Watch the violation toast → drug status → `QUARANTINED`

</details>

<details>
<summary><b>Scenario 3 — Multi-party recall</b></summary>

1. Connect as **Manufacturer** → `requestRecall`
2. Connect as **Regulator** → `approveRecall`
3. Status → `RECALLED`
4. Open `/verify/<drugId>` → ⚠️ recall warning shown

</details>

<details>
<summary><b>Scenario 4 — Public verification</b></summary>

1. Go to `/verify` — no MetaMask
2. Enter any batch ID
3. View provenance, status, supply chain history

</details>

---

## 📁 Project Structure

<details>
<summary><b>View full tree</b></summary>

```
MEDICORE/
├── blockchain/
│   ├── contracts/
│   │   └── DrugSupplyChain.sol     ← single contract, ~700 lines
│   ├── scripts/
│   │   ├── deploy.js
│   │   ├── seed.js                 ← demo data seeder
│   │   ├── register-user.js
│   │   ├── fund-and-register.js
│   │   ├── auto-approve.js
│   │   └── test-manufacture.js
│   ├── hardhat.config.js
│   ├── deployments.json
│   └── .env.example
│
└── frontend/
    ├── public/
    │   ├── MediCore-bg.mp4
    │   ├── deployments.json
    │   └── *-bg.jpg
    └── src/
        ├── blockchain/             contract.js · abi.js
        ├── components/             Navbar · Timeline · QRCode · Modal · StatCard · StatusBadge
        ├── context/                Web3Context · NotificationContext
        ├── hooks/                  useContractData · useTransaction
        ├── layouts/                DashboardLayout · PublicLayout
        ├── pages/
        │   ├── LandingPage         ConnectWallet   Register
        │   ├── DrugVerification    DrugTracking    DrugPassport
        │   ├── IoTSimulator        Analytics       TransactionExplorer
        │   ├── AdminDashboard      ManufacturerDashboard
        │   ├── WholesalerDashboard RetailerDashboard
        │   ├── CustomerDashboard   TransporterDashboard
        │   ├── QualityOfficerDashboard             RegulatorDashboard
        └── services/               anomalyDetection · iotSimulator · ipfs · scanTracking
```

</details>

---

## 🔐 Security Model

| Mechanism | Implementation |
|---|---|
| Reentrancy | OpenZeppelin `ReentrancyGuard` on all state-changing functions |
| Role enforcement | `onlyRole(Role)` checked against `entityByWallet` mapping |
| Suspension | `onlyActive` — suspended entities blocked from all functions |
| Recall integrity | 2-of-N multi-party, different roles required |
| Expiry | `_isDrugExpired()` checked before every supply operation |
| Recall immutability | `isRecalled = true` cannot revert |

---

## 🗺️ Roadmap

- [ ] Real IPFS integration (Pinata / web3.storage)
- [ ] Live analytics via The Graph event indexing
- [ ] Chainlink oracle for IoT violation reporting
- [ ] Batch genealogy DAG visualization
- [ ] Geographic shipment route map
- [ ] Sepolia public demo deployment
- [ ] Mobile QR scanner (camera API)
- [ ] Email/SMS recall alerts (off-chain layer)
- [ ] Gnosis Safe multisig for admin
- [ ] Chainlink Automation for expiry enforcement

---

> **Academic Disclaimer** — MEDICORE is a research prototype. It has not been audited. Do not use it to manage real pharmaceutical products or patient data.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:020617,50:0e7490,100:020617&height=130&section=footer&text=Built+on+Ethereum+%E2%80%94+MEDICORE&fontSize=16&fontColor=7dd3fc&fontAlignY=65&animation=fadeIn" width="100%"/>

[![GitHub](https://img.shields.io/badge/github-bhumiadi23-0ea5e9?style=flat-square&logo=github)](https://github.com/bhumiadi23)

</div>
