export const ROLE_ACCOUNTS = {
  "0x70997970c51812dc3a010c7d01b50e0d17dc79c8": {
    role: "manufacturer",
    name: "Manufacturer",
    title: "Pharmaceutical Manufacturer",
    path: "/dashboard/manufacturer",
    dashboardPath: "/dashboard/manufacturer",
    directPath: "/manufacturer",
    badgeColor: "teal",
    description: "Production, batch minting, packaging, and dispatch"
  },
  "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc": {
    role: "wholesaler",
    name: "Wholesaler",
    title: "Regional Wholesaler",
    path: "/dashboard/wholesaler",
    dashboardPath: "/dashboard/wholesaler",
    directPath: "/wholesaler",
    badgeColor: "blue",
    description: "Bulk intake, verification, inventory ledger, and retailer distribution"
  },
  "0x90f79bf6eb2c4f870365e785982e1f101e93b906": {
    role: "retailer",
    name: "Pharmacy",
    title: "Retail Pharmacy & Dispensing",
    path: "/dashboard/retailer",
    dashboardPath: "/dashboard/retailer",
    directPath: "/retailer",
    badgeColor: "emerald",
    description: "Point of Sale (POS) dispensing, verified batch inventory"
  },
  "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65": {
    role: "customer",
    name: "Customer",
    title: "Patient / End Consumer",
    path: "/dashboard/customer",
    dashboardPath: "/dashboard/customer",
    directPath: "/customer",
    badgeColor: "violet",
    description: "Patient medicine passport & cryptographic provenance"
  },
  "0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc": {
    role: "transporter",
    name: "Transporter",
    title: "Cold-Chain Logistics Carrier",
    path: "/dashboard/transporter",
    dashboardPath: "/dashboard/transporter",
    directPath: "/transporter",
    badgeColor: "amber",
    description: "Live GPS telemetry, temperature logging & verified custody handoff"
  },
  "0x976ea74026e726554db657fa54763abd0c3a0aa9": {
    role: "regulator",
    name: "Regulator",
    title: "Drug Regulatory Authority",
    path: "/dashboard/regulator",
    dashboardPath: "/dashboard/regulator",
    directPath: "/regulator",
    badgeColor: "rose",
    description: "Network oversight, sovereign recall decree, and security audits"
  },
  "0x14dc79964da2c08b23698b3d3cc7ca32193d9955": {
    role: "quality-officer",
    name: "Quality Officer",
    title: "cGMP Quality Assurance Auditor",
    path: "/dashboard/quality-officer",
    dashboardPath: "/dashboard/quality-officer",
    directPath: "/quality-officer",
    badgeColor: "purple",
    description: "Pre-distribution inspection, lab verification & quarantine decrees"
  },
  "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266": {
    role: "admin",
    name: "System Admin",
    title: "Smart Contract Administrator",
    path: "/dashboard/admin",
    dashboardPath: "/dashboard/admin",
    directPath: "/admin",
    badgeColor: "indigo",
    description: "Entity onboarding, credential authorization, and contract invariants"
  }
};

export const ALL_ROLES_LIST = [
  { role: "manufacturer", name: "Manufacturer", path: "/dashboard/manufacturer", directPath: "/manufacturer", color: "teal" },
  { role: "wholesaler", name: "Wholesaler", path: "/dashboard/wholesaler", directPath: "/wholesaler", color: "blue" },
  { role: "retailer", name: "Pharmacy", path: "/dashboard/retailer", directPath: "/retailer", color: "emerald" },
  { role: "transporter", name: "Transporter", path: "/dashboard/transporter", directPath: "/transporter", color: "amber" },
  { role: "regulator", name: "Regulator", path: "/dashboard/regulator", directPath: "/regulator", color: "rose" },
  { role: "quality-officer", name: "Quality Officer", path: "/dashboard/quality-officer", directPath: "/quality-officer", color: "purple" },
  { role: "customer", name: "Customer", path: "/dashboard/customer", directPath: "/customer", color: "violet" },
  { role: "admin", name: "System Admin", path: "/dashboard/admin", directPath: "/admin", color: "indigo" }
];

export const ROLE_ENUM_MAP = {
  0: { role: "admin", name: "System Admin", path: "/dashboard/admin", directPath: "/admin" },
  1: { role: "manufacturer", name: "Manufacturer", path: "/dashboard/manufacturer", directPath: "/manufacturer" },
  2: { role: "wholesaler", name: "Wholesaler", path: "/dashboard/wholesaler", directPath: "/wholesaler" },
  3: { role: "retailer", name: "Pharmacy", path: "/dashboard/retailer", directPath: "/retailer" },
  4: { role: "customer", name: "Customer", path: "/dashboard/customer", directPath: "/customer" },
  5: { role: "transporter", name: "Transporter", path: "/dashboard/transporter", directPath: "/transporter" },
  6: { role: "regulator", name: "Regulator", path: "/dashboard/regulator", directPath: "/regulator" },
  7: { role: "quality-officer", name: "Quality Officer", path: "/dashboard/quality-officer", directPath: "/quality-officer" }
};

export const getRoleConfigForAddress = (address, onChainRole = null) => {
  if (!address) return null;
  const normalized = address.toLowerCase();

  // 1. Direct address mapping
  if (ROLE_ACCOUNTS[normalized]) {
    return { ...ROLE_ACCOUNTS[normalized], isMapped: true };
  }

  // 2. On-chain role enum mapping (if registered with another address)
  if (onChainRole !== null && onChainRole !== undefined && ROLE_ENUM_MAP[Number(onChainRole)]) {
    return { ...ROLE_ENUM_MAP[Number(onChainRole)], isMapped: true };
  }

  // 3. Unregistered/unknown wallet: default to Manufacturer workspace
  return {
    role: "manufacturer",
    name: "Manufacturer (Default Workspace)",
    title: "Pharmaceutical Manufacturer",
    path: "/dashboard/manufacturer",
    dashboardPath: "/dashboard/manufacturer",
    directPath: "/manufacturer",
    badgeColor: "teal",
    isDefault: true,
    isMapped: false
  };
};
