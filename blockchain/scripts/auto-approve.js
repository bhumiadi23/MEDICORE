const { ethers } = require('ethers');
async function main() {
    const fs = require('fs');
    const d = JSON.parse(fs.readFileSync('deployments.json'));
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    
    // Hardhat Account 7 is the Quality Officer (from seed.js)
    const qaoPrivateKey = '0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97'; // Hardhat Account 7 PK
    const qao = new ethers.Wallet(qaoPrivateKey, provider);
    
    const abi = JSON.parse(fs.readFileSync('../frontend/src/blockchain/abi_raw.json'));
    const c = new ethers.Contract(d.address, abi, qao);
    
    const drugs = await c.getAllDrugs();
    const pending = drugs.filter(d => Number(d.status) === 1);
    
    if (pending.length === 0) {
        console.log('No pending drugs found!');
        return;
    }
    
    for(const p of pending) {
        console.log('Approving', p.drugId);
        const tx = await c.approveDrug(p.drugId, 'Approved for demo');
        await tx.wait();
        console.log('Approved!');
    }
}
main().catch(console.error);
