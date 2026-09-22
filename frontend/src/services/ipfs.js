// MOCK IPFS SERVICE for Development
// In a real application, you would use pinata/ipfs-http-client here.

const generateFakeCID = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let cid = 'Qm';
  for (let i = 0; i < 44; i++) {
    cid += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return cid;
};

export const uploadFileToIPFS = async (file) => {
  try {
    // Simulating network request
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return fake CID for now
    const cid = generateFakeCID();
    console.log(`[MOCK] Uploaded file to IPFS. CID: ${cid}`);
    return cid;
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    throw error;
  }
};

export const getIPFSUrl = (cid) => {
  if (!cid) return '';
  return `https://ipfs.io/ipfs/${cid}`;
};
