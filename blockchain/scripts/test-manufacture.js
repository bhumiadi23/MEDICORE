const hre = require('hardhat');
async function main() {
    const fs = require('fs');
    const d = JSON.parse(fs.readFileSync('deployments.json'));
    const c = await hre.ethers.getContractAt('DrugSupplyChain', d.address);
    await hre.network.provider.request({method:'hardhat_impersonateAccount',params:['0x131F6f36E86797000A94dfFaB576A6290093939D']});
    const user = await hre.ethers.getSigner('0x131F6f36E86797000A94dfFaB576A6290093939D');
    
    console.log('Testing with user...', user.address);
    try {
        const tx = await c.connect(user)['manufactureDrug(string,string,uint256,uint256,uint256)']('Test', 'TEST-999', 100, Math.floor(Date.now()/1000), Math.floor(Date.now()/1000)+86400);
        await tx.wait();
        console.log('Success!');
    } catch(e) {
        console.error('Failed:', e);
    }
}
main().catch(console.error);
