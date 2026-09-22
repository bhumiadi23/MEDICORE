const hre = require('hardhat');
async function main() {
    const fs = require('fs');
    const d = JSON.parse(fs.readFileSync('deployments.json'));
    const c = await hre.ethers.getContractAt('DrugSupplyChain', d.address);
    await hre.network.provider.request({method:'hardhat_impersonateAccount',params:['0x131F6f36E86797000A94dfFaB576A6290093939D']});
    const user = await hre.ethers.getSigner('0x131F6f36E86797000A94dfFaB576A6290093939D');
    try {
        await c.connect(user).registerEntity('Aditya Pharma', 'LIC-001', 1);
        console.log('Registered!');
    } catch(e) {
        console.log('Already registered or error:', e.message);
    }
}
main().catch(console.error);
