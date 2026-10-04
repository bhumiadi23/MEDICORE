const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("Starting Experimental Data Generation for MIKE 2026 Paper...");
    const [owner, admin, mfr, qao, whl, trn, ret] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('DrugSupplyChain');
    const contract = await Factory.deploy();

    const results = {
        authorization: { total: 0, passed: 0, rejected: 0 },
        quantity: [],
        gasCosts: []
    };

    // Experiment A: Authorization
    await contract.connect(mfr).registerEntity('Manufacturer', 'MFR-EXP', 1);
    await contract.connect(whl).registerEntity('Wholesaler', 'WHL-EXP', 2);
    await contract.connect(qao).registerEntity('Quality Officer', 'QAO-EXP', 7);
    await contract.connect(trn).registerEntity('Transporter', 'TRN-EXP', 5);
    
    results.authorization.total++;
    try {
        await contract.connect(mfr)['manufactureDrug(string,string,uint256,uint256,uint256)']('Test Drug', 'BATCH-EXP', 1000, 1690000000, 1893456000);
        results.authorization.passed++;
    } catch(e) {
        results.authorization.rejected++;
    }

    results.authorization.total++;
    try {
        await contract.connect(whl)['manufactureDrug(string,string,uint256,uint256,uint256)']('Test Drug', 'BATCH-EXP-FAIL', 1000, 1690000000, 1893456000);
        results.authorization.passed++;
    } catch(e) {
        results.authorization.rejected++;
    }

    // Approve drug
    await contract.connect(qao).approveDrug('BATCH-EXP', 'OK');

    // Experiment B: Quantity Conservation
    const hash = ethers.keccak256(ethers.toUtf8Bytes('CODE'));
    await contract.connect(mfr).createShipment('SHP-EXP-1', 'BATCH-EXP', 300, 'MFR-EXP', 'WHL-EXP', 'TRN-EXP', hash);
    const drug = await contract.getDrug('BATCH-EXP');
    results.quantity.push({ initial: 1000, transferred: 300, remaining: Number(drug.remainingQty) });

    // Performance (Gas)
    const tx = await contract.connect(mfr).createShipment('SHP-EXP-2', 'BATCH-EXP', 150, 'MFR-EXP', 'WHL-EXP', 'TRN-EXP', hash);
    const receipt = await tx.wait();
    results.gasCosts.push({ operation: 'createShipment', gasUsed: Number(receipt.gasUsed) });

    const startVerif = performance.now();
    await contract.verifyDrug('BATCH-EXP');
    const endVerif = performance.now();
    
    // Output Data
    const resDir = path.join(__dirname, '../../research/results');
    if (!fs.existsSync(resDir)) fs.mkdirSync(resDir, { recursive: true });

    fs.writeFileSync(path.join(resDir, 'authorization_results.csv'), 'Operation,Passed,Rejected,Accuracy\nAuthorization,'+results.authorization.passed+','+results.authorization.rejected+','+(results.authorization.passed/results.authorization.total)+'\n');
    fs.writeFileSync(path.join(resDir, 'quantity_results.csv'), 'Initial,Transferred,Remaining,Valid\n'+results.quantity.map(q => `${q.initial},${q.transferred},${q.remaining},${q.initial === q.transferred + q.remaining}`).join('\n') + '\n');
    fs.writeFileSync(path.join(resDir, 'performance_results.csv'), 'Operation,GasUsed,Latency_ms\n'+results.gasCosts.map(g => `${g.operation},${g.gasUsed},`).join('\n') + `\nverifyDrug,,${(endVerif - startVerif).toFixed(2)}\n`);

    console.log("Experiments Complete. Data saved to research/results.");
}

main().catch(console.error);
