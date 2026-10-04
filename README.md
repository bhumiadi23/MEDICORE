# MEDICORE - Blockchain-Based Pharmaceutical Supply Chain

## Overview & Research Motivation
MEDICORE is an intelligent blockchain framework designed to combat pharmaceutical counterfeiting and unauthorized diversion. Unlike traditional silos, MEDICORE strictly enforces mathematical quantity conservation, assigns permanent cryptographic identities to supply-chain entities, and processes real-time IoT anomalies off-chain.

## Architecture
- **Blockchain**: Hardhat / Ethereum Solidity.
- **Backend**: Node.js + Express + SQLite (Anomaly Engine).
- **Frontend**: React + Vite + Leaflet Maps.

## Features
- **REAL**: Entity Identity, Role Authorization, Quantity Conservation, Shipment Hashing, QR Verification, Recall Propagation, GPS Route Mapping.
- **SIMULATED**: IoT Temperature sensors, IPFS Decentralized Storage (`mockIpfs.js`), Customer Demo Portal.

## Setup & Reproducibility
For academic reproduction of the MIKE 2026 paper results, please consult the `research-paper/REPRODUCIBILITY.md` file located in this repository.

## Limitations
- IoT hardware is simulated via software API posts.
- IPFS is mocked in localStorage.
