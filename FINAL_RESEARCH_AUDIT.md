# FINAL RESEARCH AUDIT

## A. What is actually implemented
- Role-based Smart Contract authorization.
- Mathematical Quantity Conservation during transfers.
- Cryptographic Verification Hashes for shipments.
- Anomaly Engine (SQLite + Node.js) capturing GPS route deviations, Suspicious QRs, and Temperature spikes.
- Full React Dashboards for Manufacturers, Transporters, Wholesalers, Regulators, and Quality Officers.

## B. What was experimentally measured
- Role Authorization Accuracy (100% enforcement of onlyRole constraints).
- Quantity Conservation Validation (Initial = Remaining + Transferred).
- Gas usage for `createShipment`.
- VerifyDrug latency.

## C. What is simulated
- IoT Cold Chain sensors (generated through software POST requests).
- IPFS Document Storage (simulated in `mockIpfs.js` using browser localStorage).
- Customer Dashboard UI (hardcoded `MOCK_DEMO_DRUGS` array).

## D. What remains incomplete
- Physical IoT hardware integration.
- Decentralized Pinata IPFS deployment.
- Customer real-time blockchain wallet querying.

## E. Exact files changed
- `test/DrugSupplyChain.test.js` (Created)
- `scripts/run_experiments.js` (Created)
- `research/generate_graphs.py` (Created)
- `research-paper/main.tex` (Created)
- `research-paper/REPRODUCIBILITY.md` (Created)

## F. Exact contract changes
- None during this step, utilizing the heavily modified contract from Phase 1.

## J. Exact experiments executed
- Authorization restriction tests.
- Quantity boundary edge cases.
- Performance gas metering.

## K. Exact measured results
- See `research/results/` (CSV files for Gas, Quantity, Authorization, and Latency).

## L. Exact limitations
- Simulated sensors and IPFS prevent immediate production deployment without external infrastructure.

## M. Exact commands to reproduce results
See `research-paper/REPRODUCIBILITY.md`.

## N. Research-paper sections updated
- All required MIKE 2026 sections (Intro, Framework, Results, Limitations, Conclusion).

## O. Figures generated
- `gas_consumption.png`
- `authorization_constraints.png`
- `quantity_conservation.png`
- `verification_latency.png`
