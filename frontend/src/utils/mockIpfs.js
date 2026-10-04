export const mockIpfs = {
  upload: async (data) => {
    const cid = 'Qm' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem(cid, JSON.stringify(data));
    return cid;
  },
  get: async (cid) => {
    const data = localStorage.getItem(cid);
    return data ? JSON.parse(data) : null;
  }
};
