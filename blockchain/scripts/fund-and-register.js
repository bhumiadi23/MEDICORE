const hre = require('hardhat');
async function main() {
    const fs = require('fs');
    const d = JSON.parse(fs.readFileSync('deployments.json'));
    const c = await hre.ethers.getContractAt('DrugSupplyChain', d.address);
    const [admin] = await hre.ethers.getSigners();
    
    // Fund
    await admin.sendTransaction({to:'0x131F6f36E86797000A94dfFaB576A6290093939D', value:hre.ethers.parseEther('100')});
    
    // Impersonate
    await hre.network.provider.request({method:'hardhat_impersonateAccount',params:['0x131F6f36E86797000A94dfFaB576A6290093939D']});
    const user = await hre.ethers.getSigner('0x131F6f36E86797000A94dfFaB576A6290093939D');
    
    // Register
    await c.connect(user).registerEntity('ADITYA KUMAR ROY', 'LIC-001', 1);
    console.log('User funded and registered!');
}
main().catch(console.error);
