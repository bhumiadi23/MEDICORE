const hre = require('hardhat');
async function main() {
    const fs = require('fs');
    const d = JSON.parse(fs.readFileSync('deployments.json'));
    const c = await hre.ethers.getContractAt('DrugSupplyChain', d.address);
    const qaoAddress = '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955';
    
    await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [qaoAddress]
    });
    
    // Give them some ETH just in case
    const [admin] = await hre.ethers.getSigners();
    await admin.sendTransaction({to: qaoAddress, value: hre.ethers.parseEther('10')});
    
    const qao = await hre.ethers.getSigner(qaoAddress);
    
    const drugs = await c.getAllDrugs();
    const pending = drugs.filter(d => Number(d.status) === 1);
    
    if (pending.length === 0) {
        console.log('No pending drugs found!');
        return;
    }
    
    for(const p of pending) {
        console.log('Approving', p.drugId);
        const tx = await c.connect(qao).approveDrug(p.drugId, 'Approved for demo');
        await tx.wait();
        console.log('Approved!');
    }
}
main().catch(console.error);
