const hre = require("hardhat");
async function main() {
  const address = require("../frontend/src/blockchain/deployments.json").address;
  const contract = await hre.ethers.getContractAt("DrugSupplyChain", address);
  const qao = "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955";
  const entity = await contract.getEntityByWallet(qao);
  console.log(entity);
}
main().catch(console.error);
