const hre = require('hardhat');
async function main() {
    const fs = require('fs');
    const d = JSON.parse(fs.readFileSync('deployments.json'));
    const c = await hre.ethers.getContractAt('DrugSupplyChain', d.address);
    const targetAddress = '0xDe1e3f0fa6693da1c2d9b02f0E87D53784e0CCb0';

    await hre.network.provider.request({method:'hardhat_impersonateAccount',params:[targetAddress]});
    const user = await hre.ethers.getSigner(targetAddress);
    try {
        const tx = await c.connect(user).registerEntity('Aditya Pharma', 'LIC-002', 1);
        await tx.wait();
        console.log('Registered successfully with LIC-002!');
    } catch(e) {
        console.log('Already registered or error:', e.message);
    }
}
main().catch(console.error);
