const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🌱 Seeding DrugChain 2.0 with comprehensive demo data...\n");

  const signers = await hre.ethers.getSigners();
  const [admin, manufacturer, wholesaler, retailer, customer, transporter, regulator, qualityOfficer] = signers;

  // Load deployment
  const deploymentPath = path.join(__dirname, "..", "deployments.json");
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ deployments.json not found. Run 'npm run deploy' first.");
    process.exit(1);
  }
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contractAddress = deployment.address;
  console.log("📋 Contract address:", contractAddress, "\n");

  const DrugSupplyChain = await hre.ethers.getContractFactory("DrugSupplyChain");
  const contract = DrugSupplyChain.attach(contractAddress);

  // ── Register All Entities ──────────────────────────────────────────
  console.log("📝 Registering entities...");

  // Role enum: None=0, Manufacturer=1, Wholesaler=2, Retailer=3, Customer=4, Transporter=5, Regulator=6, QualityOfficer=7
  await contract.connect(manufacturer).registerEntity("ABC Pharmaceuticals", "MFR-001", 1);
  console.log("  ✅ MFR-001 — ABC Pharmaceuticals (Manufacturer)     →", manufacturer.address);

  await contract.connect(wholesaler).registerEntity("XYZ Wholesalers", "WHL-001", 2);
  console.log("  ✅ WHL-001 — XYZ Wholesalers (Wholesaler)            →", wholesaler.address);

  await contract.connect(retailer).registerEntity("CityCare Pharmacy", "RET-001", 3);
  console.log("  ✅ RET-001 — CityCare Pharmacy (Retailer)            →", retailer.address);

  await contract.connect(customer).registerEntity("Rahul Sharma", "CUS-001", 4);
  console.log("  ✅ CUS-001 — Rahul Sharma (Customer)                 →", customer.address);

  await contract.connect(transporter).registerEntity("FastMed Logistics", "TRN-001", 5);
  console.log("  ✅ TRN-001 — FastMed Logistics (Transporter)         →", transporter.address);

  await contract.connect(regulator).registerEntity("Drug Regulatory Authority", "REG-001", 6);
  console.log("  ✅ REG-001 — Drug Regulatory Authority (Regulator)   →", regulator.address);

  await contract.connect(qualityOfficer).registerEntity("Dr. Priya Mehta", "QAO-001", 7);
  console.log("  ✅ QAO-001 — Dr. Priya Mehta (Quality Officer)       →", qualityOfficer.address);

  // ── Manufacture Drugs ──────────────────────────────────────────────
  console.log("\n💊 Manufacturing drug batches...");

  const now = Math.floor(Date.now() / 1000);
  const oneYear = 365 * 24 * 60 * 60;
  const thirtyDays = 30 * 24 * 60 * 60;

  // Drug 1: Paracetamol 500mg (normal batch)
  try {
    await contract.connect(manufacturer).manufactureDrug(
      "Paracetamol 500mg",    // drugName
      "PARA-2026-001",         // drugId
      10000,                   // quantity
      now,                     // manufacturingDate
      now + oneYear            // expiryDate
    );
    console.log("  ✅ PARA-2026-001 — Paracetamol 500mg (10,000 units)");
  } catch (e) {
    console.log("  ⚠️  PARA-2026-001 skipped:", e.reason || e.message);
  }

  // Drug 2: Amoxicillin 250mg (will be recalled)
  try {
    await contract.connect(manufacturer).manufactureDrug(
      "Amoxicillin 250mg",
      "AMOX-2026-001",
      5000,
      now,
      now + oneYear
    );
    console.log("  ✅ AMOX-2026-001 — Amoxicillin 250mg (5,000 units)");
  } catch (e) {
    console.log("  ⚠️  AMOX-2026-001 skipped:", e.reason || e.message);
  }

  // Drug 3: Insulin (cold chain)
  try {
    await contract.connect(manufacturer).manufactureDrug(
      "Insulin Glargine 100IU/mL",
      "INSU-2026-001",
      2000,
      now,
      now + oneYear
    );
    console.log("  ✅ INSU-2026-001 — Insulin Glargine (2,000 units)");
  } catch (e) {
    console.log("  ⚠️  INSU-2026-001 skipped:", e.reason || e.message);
  }

  // Drug 4: Vaccine (expiring soon)
  try {
    await contract.connect(manufacturer).manufactureDrug(
      "COVID-19 Vaccine mRNA",
      "VACC-2026-001",
      50000,
      now - (11 * 30 * 24 * 60 * 60), // manufactured 11 months ago
      now + thirtyDays                  // expires in 30 days
    );
    console.log("  ✅ VACC-2026-001 — COVID-19 Vaccine (50,000 units, expiring in 30 days)");
  } catch (e) {
    console.log("  ⚠️  VACC-2026-001 skipped:", e.reason || e.message);
  }

  // Drug 5: Metformin (for quarantine scenario)
  try {
    await contract.connect(manufacturer).manufactureDrug(
      "Metformin 500mg",
      "METF-2026-001",
      8000,
      now,
      now + oneYear
    );
    console.log("  ✅ METF-2026-001 — Metformin 500mg (8,000 units)");
  } catch (e) {
    console.log("  ⚠️  METF-2026-001 skipped:", e.reason || e.message);
  }

  // ── Quality Approvals ──────────────────────────────────────────────
  console.log("\n🔬 Quality Officer reviewing batches...");

  try {
    await contract.connect(qualityOfficer).approveDrug("PARA-2026-001", "All quality parameters met. Batch approved for distribution.");
    console.log("  ✅ PARA-2026-001 — Quality APPROVED");
  } catch (e) {
    console.log("  ⚠️  Quality approval PARA skipped:", e.reason || e.message);
  }

  try {
    await contract.connect(qualityOfficer).approveDrug("AMOX-2026-001", "Batch meets WHO standards.");
    console.log("  ✅ AMOX-2026-001 — Quality APPROVED");
  } catch (e) {
    console.log("  ⚠️  Quality approval AMOX skipped:", e.reason || e.message);
  }

  try {
    await contract.connect(qualityOfficer).approveDrug("INSU-2026-001", "Cold chain verified. Approved.");
    console.log("  ✅ INSU-2026-001 — Quality APPROVED");
  } catch (e) {
    console.log("  ⚠️  Quality approval INSU skipped:", e.reason || e.message);
  }

  try {
    await contract.connect(qualityOfficer).approveDrug("VACC-2026-001", "Vaccine potency verified.");
    console.log("  ✅ VACC-2026-001 — Quality APPROVED");
  } catch (e) {
    console.log("  ⚠️  Quality approval VACC skipped:", e.reason || e.message);
  }

  try {
    await contract.connect(qualityOfficer).approveDrug("METF-2026-001", "Approved with standard parameters.");
    console.log("  ✅ METF-2026-001 — Quality APPROVED");
  } catch (e) {
    console.log("  ⚠️  Quality approval METF skipped:", e.reason || e.message);
  }

  // ── Supply Chain Transfers ─────────────────────────────────────────
  console.log("\n📦 Running supply chain transfers...");

  // PARA-2026-001: Full chain M -> W -> R -> C
  try {
    await contract.connect(manufacturer).supplyToWholesaler("PARA-2026-001", "WHL-001", 4000);
    console.log("  ✅ MFR-001 → WHL-001: 4,000 units of PARA-2026-001");
  } catch (e) {
    console.log("  ⚠️  M→W PARA skipped:", e.reason || e.message);
  }

  try {
    await contract.connect(wholesaler).supplyToRetailer("PARA-2026-001", "RET-001", 1500);
    console.log("  ✅ WHL-001 → RET-001: 1,500 units of PARA-2026-001");
  } catch (e) {
    console.log("  ⚠️  W→R PARA skipped:", e.reason || e.message);
  }

  try {
    await contract.connect(retailer).supplyToCustomer("PARA-2026-001", "CUS-001", 50);
    console.log("  ✅ RET-001 → CUS-001: 50 units of PARA-2026-001");
  } catch (e) {
    console.log("  ⚠️  R→C PARA skipped:", e.reason || e.message);
  }

  // AMOX-2026-001: Partial distribution
  try {
    await contract.connect(manufacturer).supplyToWholesaler("AMOX-2026-001", "WHL-001", 2000);
    console.log("  ✅ MFR-001 → WHL-001: 2,000 units of AMOX-2026-001");
  } catch (e) {
    console.log("  ⚠️  M→W AMOX skipped:", e.reason || e.message);
  }

  // INSU-2026-001: Partial distribution
  try {
    await contract.connect(manufacturer).supplyToWholesaler("INSU-2026-001", "WHL-001", 500);
    console.log("  ✅ MFR-001 → WHL-001: 500 units of INSU-2026-001");
  } catch (e) {
    console.log("  ⚠️  M→W INSU skipped:", e.reason || e.message);
  }

  // VACC-2026-001: Partial
  try {
    await contract.connect(manufacturer).supplyToWholesaler("VACC-2026-001", "WHL-001", 10000);
    console.log("  ✅ MFR-001 → WHL-001: 10,000 units of VACC-2026-001");
  } catch (e) {
    console.log("  ⚠️  M→W VACC skipped:", e.reason || e.message);
  }

  try {
    await contract.connect(wholesaler).supplyToRetailer("VACC-2026-001", "RET-001", 3000);
    console.log("  ✅ WHL-001 → RET-001: 3,000 units of VACC-2026-001");
  } catch (e) {
    console.log("  ⚠️  W→R VACC skipped:", e.reason || e.message);
  }

  // METF-2026-001: Will be quarantined
  try {
    await contract.connect(manufacturer).supplyToWholesaler("METF-2026-001", "WHL-001", 3000);
    console.log("  ✅ MFR-001 → WHL-001: 3,000 units of METF-2026-001");
  } catch (e) {
    console.log("  ⚠️  M→W METF skipped:", e.reason || e.message);
  }

  // ── Add Documents ──────────────────────────────────────────────────
  console.log("\n📄 Adding IPFS documents...");

  try {
    await contract.connect(manufacturer).addDocument("PARA-2026-001", "manufacturing_cert", "QmX7b3eZ1kPFrGhN4tY2cA8pDq9wR5vE6mJ0uWxSfHjK");
    console.log("  ✅ PARA-2026-001 — Manufacturing Certificate added");
  } catch (e) {
    console.log("  ⚠️  Doc add skipped:", e.reason || e.message);
  }

  try {
    await contract.connect(manufacturer).addDocument("PARA-2026-001", "quality_cert", "QmR8k2fP4qKhW1nM5yB3eA9jDs7xN6tV0uZwXcHgG2iL");
    console.log("  ✅ PARA-2026-001 — Quality Certificate added");
  } catch (e) {
    console.log("  ⚠️  Doc add skipped:", e.reason || e.message);
  }

  try {
    await contract.connect(manufacturer).addDocument("INSU-2026-001", "lab_report", "QmT9l3gQ5rLiX2oN6zA4eB0kEt8yO7uW1vYxDdIhH3jM");
    console.log("  ✅ INSU-2026-001 — Lab Report added");
  } catch (e) {
    console.log("  ⚠️  Doc add skipped:", e.reason || e.message);
  }

  // ── Recall Scenario (AMOX batch) ───────────────────────────────────
  console.log("\n🚨 Initiating recall for AMOX-2026-001...");

  try {
    await contract.connect(manufacturer).requestRecall("AMOX-2026-001", "Contamination detected in Batch AMOX-2026-001. Immediate recall required.");
    console.log("  ✅ Recall REQUESTED by Manufacturer");
  } catch (e) {
    console.log("  ⚠️  Recall request skipped:", e.reason || e.message);
  }

  try {
    await contract.connect(qualityOfficer).approveRecall("AMOX-2026-001");
    console.log("  ✅ Recall APPROVED by Quality Officer (2/3 achieved → ACTIVE)");
  } catch (e) {
    console.log("  ⚠️  Recall approval skipped:", e.reason || e.message);
  }

  // ── Environmental Violation Scenario (METF batch) ──────────────────
  console.log("\n🌡️ Reporting temperature violation for METF-2026-001...");

  try {
    await contract.connect(transporter).reportEnvironmentalViolation("METF-2026-001", "SHIP-METF-001", 114);
    // 114 = 11.4°C (stored in tenths)
    console.log("  ✅ Temperature violation reported: 11.4°C (expected 2-8°C range)");
    console.log("  ✅ METF-2026-001 automatically FLAGGED");
  } catch (e) {
    console.log("  ⚠️  Env violation skipped:", e.reason || e.message);
  }

  // ── Print Summary ──────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("🎉 DrugChain 2.0 Demo Data Loaded Successfully!");
  console.log("═".repeat(60));
  console.log("\n📊 Summary:");
  console.log("  Entities:     7 (Manufacturer, Wholesaler, Retailer, Customer, Transporter, Regulator, Quality Officer)");
  console.log("  Drug Batches: 5 (Paracetamol, Amoxicillin, Insulin, Vaccine, Metformin)");
  console.log("  Transfers:    7 (M→W, W→R, R→C flows)");
  console.log("  Documents:    3 (Manufacturing Cert, Quality Cert, Lab Report)");
  console.log("  Recalls:      1 (AMOX-2026-001 — Active Recall)");
  console.log("  Violations:   1 (METF-2026-001 — Temperature Excursion)");
  console.log("\n📋 Account Mapping:");
  console.log("  Account #0 — Admin (Contract Owner)           →", admin.address);
  console.log("  Account #1 — ABC Pharmaceuticals (Manufacturer) →", manufacturer.address);
  console.log("  Account #2 — XYZ Wholesalers (Wholesaler)     →", wholesaler.address);
  console.log("  Account #3 — CityCare Pharmacy (Retailer)     →", retailer.address);
  console.log("  Account #4 — Rahul Sharma (Customer)          →", customer.address);
  console.log("  Account #5 — FastMed Logistics (Transporter)  →", transporter.address);
  console.log("  Account #6 — Drug Regulatory Authority (Regulator) →", regulator.address);
  console.log("  Account #7 — Dr. Priya Mehta (Quality Officer)→", qualityOfficer.address);
  console.log("\n🔗 Demo Scenarios:");
  console.log("  ✅ PARA-2026-001 — Normal flow (M→W→R→C complete)");
  console.log("  🚨 AMOX-2026-001 — Recalled batch");
  console.log("  ❄️  INSU-2026-001 — Cold chain drug (insulin)");
  console.log("  ⏰ VACC-2026-001 — Expiring soon (30 days)");
  console.log("  🌡️  METF-2026-001 — Temperature violation (flagged)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
