export const ROLE_LABELS = {
  0: 'None',
  1: 'Manufacturer',
  2: 'Wholesaler',
  3: 'Retailer',
  4: 'Customer',
  5: 'Transporter',
  6: 'Regulator',
  7: 'Quality Officer'
};

export const ROLE_ROUTES = {
  1: '/manufacturer',
  2: '/wholesaler',
  3: '/retailer',
  4: '/customer',
  5: '/transporter',
  6: '/regulator',
  7: '/quality-officer'
};

export const DRUG_STATUS_LABELS = {
  0: 'Created', 1: 'Quality Pending', 2: 'Quality Approved', 3: 'Available',
  4: 'In Transit', 5: 'Delivered', 6: 'Flagged', 7: 'Quarantined',
  8: 'Under Investigation', 9: 'Released', 10: 'Recalled', 11: 'Expired', 12: 'Sold'
};

export const DRUG_STATUS_COLORS = {
  0: 'gray', 1: 'yellow', 2: 'green', 3: 'blue', 4: 'indigo', 5: 'green',
  6: 'orange', 7: 'red', 8: 'purple', 9: 'green', 10: 'red', 11: 'gray', 12: 'emerald'
};

export const SHIPMENT_STATUS_LABELS = {
  0: 'Preparing', 1: 'Dispatched', 2: 'In Transit', 3: 'Arrived', 4: 'Delivered', 5: 'Delayed', 6: 'Quarantined'
};

export const getRoleLabel = (role) => {
  return ROLE_LABELS[role] || 'Unknown';
};

export const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  const ts = Number(timestamp);
  if (ts === 0) return 'N/A';
  return new Date(ts * 1000).toLocaleDateString();
};

export const formatDateTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  const ts = Number(timestamp);
  if (ts === 0) return 'N/A';
  return new Date(ts * 1000).toLocaleString();
};

export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const shortAddress = formatAddress;

export const formatTemperature = (temp) => {
  return `${temp}°C`;
};

export const getRiskLevel = (score) => {
  if (score < 25) return 'LOW';
  if (score < 50) return 'MEDIUM';
  if (score < 75) return 'HIGH';
  return 'CRITICAL';
};
