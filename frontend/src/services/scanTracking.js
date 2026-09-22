// Stores scan history in localStorage for demo purposes
const SCAN_STORAGE_KEY = 'MediCore_scans';

export const recordScan = (drugId) => {
  try {
    const scans = JSON.parse(localStorage.getItem(SCAN_STORAGE_KEY) || '{}');
    if (!scans[drugId]) {
      scans[drugId] = [];
    }
    scans[drugId].push(Date.now());
    localStorage.setItem(SCAN_STORAGE_KEY, JSON.stringify(scans));
    return scans[drugId];
  } catch (e) {
    console.error('Failed to record scan:', e);
    return [];
  }
};

export const getScanHistory = (drugId) => {
  try {
    const scans = JSON.parse(localStorage.getItem(SCAN_STORAGE_KEY) || '{}');
    const drugScans = scans[drugId] || [];
    const suspicious = detectSuspicious(drugId, drugScans);
    
    return {
      count: drugScans.length,
      timestamps: drugScans,
      suspicious
    };
  } catch (e) {
    return { count: 0, timestamps: [], suspicious: false };
  }
};

export const detectSuspicious = (drugId, scans) => {
  if (!scans || scans.length < 5) return false;
  
  // E.g. more than 5 scans in the last 1 hour could be suspicious
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  const recentScans = scans.filter(t => t > oneHourAgo);
  
  return recentScans.length > 5;
};

