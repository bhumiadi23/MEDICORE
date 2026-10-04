const hre = require("hardhat");
const deployments = require("../deployments.json");

async function main() {
  const [owner] = await hre.ethers.getSigners();
  const contractAddress = deployments.address;
  const contract = await hre.ethers.getContractAt("DrugSupplyChain", contractAddress);

  const entity = await contract.getEntityById("QAO-001");
  console.log("Current state of Priya Mehta:", entity.isActive ? "Active" : "Suspended");

  if (!entity.isActive) {
    const tx = await contract.connect(owner).activateEntity("QAO-001");
    await tx.wait();
    console.log("Priya Mehta has been successfully PERMITTED (Activated)!");
  } else {
    console.log("Priya Mehta is already permitted.");
  }
}

main().catch(console.error);

