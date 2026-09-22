const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying DrugChain 2.0 Contract...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log(
    "Deployer balance:",
    hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)),
    "ETH\n"
  );

  const DrugSupplyChain = await hre.ethers.getContractFactory("DrugSupplyChain");
  const contract = await DrugSupplyChain.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("✅ DrugSupplyChain V2 deployed to:", contractAddress);

  const deployment = {
    address: contractAddress,
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337,
    deployedAt: new Date().toISOString(),
    version: "2.0.0",
  };

  const jsonData = JSON.stringify(deployment, null, 2);

  // Write to frontend locations
  const frontendSrcDir = path.join(__dirname, "../../frontend/src/blockchain");
  if (fs.existsSync(path.join(__dirname, "../../frontend"))) {
    fs.mkdirSync(frontendSrcDir, { recursive: true });
    fs.writeFileSync(path.join(frontendSrcDir, "deployments.json"), jsonData);
    console.log("📄 Written to frontend/src/blockchain/deployments.json");

    const frontendPublicDir = path.join(__dirname, "../../frontend/public");
    fs.mkdirSync(frontendPublicDir, { recursive: true });
    fs.writeFileSync(path.join(frontendPublicDir, "deployments.json"), jsonData);
    console.log("📄 Written to frontend/public/deployments.json");
  }

  // Copy ABI to frontend
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/DrugSupplyChain.sol/DrugSupplyChain.json"
  );
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const abiJson = JSON.stringify(artifact.abi, null, 2);
    fs.writeFileSync(path.join(frontendSrcDir, "abi_raw.json"), abiJson);
    console.log("📄 ABI written to frontend/src/blockchain/abi_raw.json");
  }

  // Also write next to blockchain dir
  fs.writeFileSync(path.join(__dirname, "..", "deployments.json"), jsonData);
  console.log("📄 Written to blockchain/deployments.json");

  console.log("\n🎉 DrugChain 2.0 deployment complete!");
  console.log("Contract address:", contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
