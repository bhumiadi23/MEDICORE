export const analyzeRisk = (drugData, environmentalData, scanData) => {
  let coldChainRisk = 0;
  let routeRisk = 0;
  let transactionRisk = 0;
  let qrRisk = 0;

  // 1. Cold chain risk
  if (environmentalData && environmentalData.violations > 0) {
    coldChainRisk = Math.min(100, environmentalData.violations * 30);
  }

  // 2. Transaction risk (e.g. unexpected jumps in ownership)
  if (drugData && drugData.status === 10) { // Recalled
    transactionRisk = 100;
  }

  // 3. QR Scan risk (e.g. multiple scans in short time from different locations)
  if (scanData) {
    if (scanData.suspicious) qrRisk = 90;
    else if (scanData.count > 10) qrRisk = 50;
  }

  const overallScore = Math.max(coldChainRisk, routeRisk, transactionRisk, qrRisk);
  
  let level = 'LOW';
  if (overallScore >= 75) level = 'CRITICAL';
  else if (overallScore >= 50) level = 'HIGH';
  else if (overallScore >= 25) level = 'MEDIUM';

  return {
    coldChainRisk,
    routeRisk,
    transactionRisk,
    qrRisk,
    overallScore,
    level
  };
};
