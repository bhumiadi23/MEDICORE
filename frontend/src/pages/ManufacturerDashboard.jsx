import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useTransaction } from '../hooks/useTransaction';
import { PackagePlus, Send, Archive, AlertTriangle, FileUp, Activity, Cpu, Hexagon, CheckCircle2, Copy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDateTime } from '../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';
import { mockIpfs } from '../utils/mockIpfs';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

const GlowingStatCard = ({ icon: Icon, title, value, color }) => (
  <div className="relative group overflow-hidden rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 flex flex-col justify-between h-32 hover:border-white/20 transition-all duration-300">
    <div className={`absolute -right-10 -top-10 w-32 h-32 bg-${color}-500/20 rounded-full blur-3xl group-hover:bg-${color}-500/30 transition-all`}></div>
    <div className="flex justify-between items-start relative z-10">
      <p className="text-slate-400 font-medium text-sm tracking-wide uppercase">{title}</p>
      <div className={`p-2 rounded-lg bg-${color}-500/10 border border-${color}-500/20`}>
        <Icon className={`h-5 w-5 text-${color}-400`} />
      </div>
    </div>
    <div className="relative z-10">
      <h3 className={`text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-${color}-200`}>
        {value}
      </h3>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md border border-blue-500/30 p-4 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.3)]">
        <p className="text-white font-bold mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-mono flex justify-between gap-4" style={{ color: entry.color }}>
            <span>{entry.name}:</span>
            <span>{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ManufacturerDashboard = () => {
  const { contract, entityInfo } = useWeb3();
  const { execute, isLoading } = useTransaction();
  const [drugs, setDrugs] = useState([]);
  const [formData, setFormData] = useState({ drugName: '', drugId: '', quantity: '', expiryDays: '365' });
  const [dispatchData, setDispatchData] = useState({ drugId: '', receiverId: '', transporterId: '', quantity: '' });
  const [dispatchPreview, setDispatchPreview] = useState({ receiver: null, transporter: null });
  const [suspendReason, setSuspendReason] = useState(null);
  const [successModal, setSuccessModal] = useState({ isOpen: false, data: null });
  const [dispatchError, setDispatchError] = useState('');

  const fetchDrugs = async () => {
    if (!contract || !entityInfo) return;
    try {
      const allDrugs = await contract.getAllDrugs();
      const myDrugs = allDrugs.filter(d => d.manufacturerId === entityInfo.id && d.exists);
      setDrugs(myDrugs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDrugs();
  }, [contract, entityInfo]);

  useEffect(() => {
    const fetchSuspensionReason = async () => {
       if (entityInfo && !entityInfo.isActive && contract && contract.getAdminAuditLogs) {
           try {
             const logs = await contract.getAdminAuditLogs();
             const entityLogs = logs.filter(l => l.entityId === entityInfo.id && l.actionType === 'suspendEntity');
             if (entityLogs.length > 0) {
                const latestLog = entityLogs[entityLogs.length - 1];
                setSuspendReason(latestLog.reason);
             }
           } catch(e) {
             console.error("Error fetching logs", e);
           }
       }
    };
    fetchSuspensionReason();
  }, [contract, entityInfo]);

  useEffect(() => {
    const fetchProfiles = async () => {
       if(!contract) return;
       let receiver = null;
       let transporter = null;
       try {
           if(dispatchData.receiverId) receiver = await contract.getEntityById(dispatchData.receiverId);
           if(dispatchData.transporterId) transporter = await contract.getEntityById(dispatchData.transporterId);
       } catch(e) {}
       setDispatchPreview({ 
           receiver: receiver?.isRegistered ? receiver : null, 
           transporter: transporter?.isRegistered ? transporter : null 
       });
    };
    fetchProfiles();
  }, [dispatchData.receiverId, dispatchData.transporterId, contract]);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, data: null });

  if (entityInfo && !entityInfo.isActive) {
    return (
      <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center p-8 bg-red-950/95 backdrop-blur-xl">
         <AlertTriangle className="w-24 h-24 text-red-500 mb-6 animate-pulse" />
         <h1 className="text-4xl font-black text-white tracking-widest mb-4 text-center">MANUFACTURER ACCOUNT SUSPENDED</h1>
         <p className="text-xl text-red-200 text-center max-w-2xl bg-red-900/50 p-6 rounded-xl border border-red-500/30">
            Your account has been suspended by the network administrator. All cryptographic actions and supply chain access are blocked.
            <br/><br/>
            <strong>Reason:</strong> {suspendReason || 'Contact network admin for details.'}
         </p>
      </div>
    );
  }

  const handleManufactureRequest = (e) => {
    e.preventDefault();
    setConfirmModal({
      isOpen: true,
      data: { ...formData }
    });
  };

  const handleManufactureConfirm = async () => {
    const data = confirmModal.data;
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + (Number(data.expiryDays) * 24 * 60 * 60);
    
    setConfirmModal({ isOpen: false, data: null });
    
    try {
      const success = await execute('manufactureDrug(string,string,uint256,uint256,uint256)', data.drugName, data.drugId, Number(data.quantity), now, expiry);
      if (success) {
        setFormData({ drugName: '', drugId: '', quantity: '', expiryDays: '365' });
        fetchDrugs();
      }
    } catch(err) { console.error(err); }
  };

  const handleDispatch = async (e) => {
    e.preventDefault();
    const { drugId, receiverId, transporterId, quantity } = dispatchData;
    const qty = Number(quantity);
    setDispatchError('');

    const targetDrug = drugs.find(d => d.drugId === drugId);
    if (!targetDrug) {
      setDispatchError('Please select a valid batch.');
      toast.error('Please select a valid batch.');
      return;
    }

    if (qty > Number(targetDrug.remainingQty)) {
      const msg = `Quantity Conservation Error: Cannot transfer ${qty} units. Remaining stock is only ${targetDrug.remainingQty} units!`;
      setDispatchError(msg);
      toast.error(msg);
      return;
    }
    
    try {
      const shipmentId = `SH-${Date.now()}`;
      
      // Generate a secure verification code
      const randStr = Math.random().toString(36).substring(2, 6).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
      const verificationCode = `MC-${randStr}`;
      
      // Hash it for the smart contract
      const verificationHash = ethers.keccak256(ethers.toUtf8Bytes(verificationCode));

      const shipSuccess = await execute('createShipment', shipmentId, drugId, qty, entityInfo.id, receiverId, transporterId, verificationHash);
      if (shipSuccess) {
          try {
            let originCoords = [19.0760, 72.8777];
            if (contract.getEntityProfileCID) {
              const profileCid = await contract.getEntityProfileCID(entityInfo.id);
              if (profileCid) {
                const profile = await mockIpfs.get(profileCid);
                if (profile && profile.location) originCoords = profile.location;
              }
            }
            fetch('http://localhost:3001/api/shipments/' + shipmentId + '/location', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ lat: originCoords[0], lng: originCoords[1] })
            }).catch(console.error);
          } catch(e) {
            console.error("Error with IPFS profile fetch", e);
          }

         setSuccessModal({
           isOpen: true,
           data: {
             shipmentId,
             drugId,
             quantity: qty,
             from: entityInfo.id,
             to: receiverId,
             transporter: transporterId,
             status: 'IN TRANSIT',
             verificationCode
           }
         });
         
         setDispatchData({ drugId: '', receiverId: '', transporterId: '', quantity: '' });
         fetchDrugs();
      } else {
         const failMsg = "Transaction reverted: Insufficient manufacturer stock or unauthorized role.";
         setDispatchError(failMsg);
         toast.error(`? Blockchain Revert: ${failMsg}`);
      }
    } catch(err) { 
        console.error(err);
        if(err.data?.message) {
            alert(`Transaction failed: ${err.data.message}`);
        } else if (err.message) {
            alert(`Error: ${err.message}`);
        }
    }
  };

  const chartData = drugs.map(d => ({
    name: d.drugName,
    Manufactured: Number(d.manufacturedQty),
    Remaining: Number(d.remainingQty)
  })).slice(0, 5);

  const stats = {
    total: drugs.length,
    active: drugs.filter(d => !d.isRecalled && Number(d.remainingQty) > 0).length,
    empty: drugs.filter(d => Number(d.remainingQty) === 0).length,
    recalled: drugs.filter(d => d.isRecalled).length,
  };

  return (
    <div className="space-y-8 relative">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <GlowingStatCard icon={Archive} title="Total Batches" value={stats.total} color="blue" />
        <GlowingStatCard icon={PackagePlus} title="Active Inventory" value={stats.active} color="emerald" />
        <GlowingStatCard icon={Send} title="Depleted" value={stats.empty} color="slate" />
        <GlowingStatCard icon={AlertTriangle} title="Recalled" value={stats.recalled} color="red" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Cpu className="w-48 h-48" />
          </div>
          
          <div className="flex items-center mb-8 relative z-10">
            <div className="bg-blue-500/20 p-3 rounded-xl border border-blue-500/30 mr-4 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <PackagePlus className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-wide">Register Production Batch</h3>
              <p className="text-slate-400 text-sm mt-1">Cryptographically mint new pharmaceutical units</p>
            </div>
          </div>
          
          <form onSubmit={handleManufactureRequest} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-blue-300 uppercase tracking-widest">Drug Nomenclature</label>
                <input required 
                  className="w-full bg-black/40 border border-slate-700 rounded-xl px-5 py-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" 
                  placeholder="e.g. Paracetamol 500mg" 
                  value={formData.drugName} 
                  onChange={e => setFormData({...formData, drugName: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-blue-300 uppercase tracking-widest">Batch Hash / ID</label>
                <input required 
                  className="w-full bg-black/40 border border-slate-700 rounded-xl px-5 py-3 text-blue-400 font-mono placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-inner" 
                  placeholder="e.g. BATCH-2026-XYZ" 
                  value={formData.drugId} 
                  onChange={e => setFormData({...formData, drugId: e.target.value})} 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-blue-300 uppercase tracking-widest">Production Volume</label>
                <input required type="number" min="1" 
                  className="w-full bg-black/40 border border-slate-700 rounded-xl px-5 py-3 text-white font-mono focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" 
                  value={formData.quantity} 
                  onChange={e => setFormData({...formData, quantity: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-blue-300 uppercase tracking-widest">Validity Lifecycle (Days)</label>
                <input required type="number" min="1" 
                  className="w-full bg-black/40 border border-slate-700 rounded-xl px-5 py-3 text-white font-mono focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" 
                  value={formData.expiryDays} 
                  onChange={e => setFormData({...formData, expiryDays: e.target.value})} 
                />
              </div>
            </div>
            
            <div className="pt-4">
              <div className="border border-dashed border-white/20 bg-white/5 rounded-xl p-6 text-center hover:bg-white/10 hover:border-blue-500/50 transition-all cursor-pointer group">
                <FileUp className="h-8 w-8 text-slate-500 group-hover:text-blue-400 mx-auto mb-3 transition-colors" />
                <p className="text-sm font-medium text-slate-300">Attach Cryptographic Certificate of Analysis (CoA)</p>
                <p className="text-xs text-slate-500 mt-1 font-mono">Supports IPFS hashes or encrypted PDFs</p>
              </div>
            </div>

            <button disabled={isLoading} className="w-full relative overflow-hidden bg-blue-600 text-white font-black tracking-widest uppercase py-4 rounded-xl hover:bg-blue-500 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] mt-6 group">
              <span className="relative z-10">MINT BATCH ON BLOCKCHAIN</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] skew-x-12"></div>
            </button>
          </form>
        </motion.div>

        <div className="space-y-8 lg:col-span-1">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900/50 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden"
          >
            <div className="absolute -bottom-6 -right-6 text-teal-500/10">
              <Hexagon className="w-32 h-32" />
            </div>

            <div className="flex items-center mb-6 relative z-10">
              <div className="bg-teal-500/20 p-2.5 rounded-xl border border-teal-500/30 mr-3 shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                <Send className="h-5 w-5 text-teal-400" />
              </div>
              <h3 className="text-lg font-black text-white tracking-wide">Create & Dispatch Shipment</h3>
            </div>

            <form onSubmit={handleDispatch} className="space-y-5 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-teal-300 uppercase tracking-widest">Select Target Batch</label>
                <select required 
                  className="w-full bg-black/40 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono focus:ring-2 focus:ring-teal-500/50 outline-none transition-all appearance-none" 
                  value={dispatchData.drugId} 
                  onChange={e => setDispatchData({...dispatchData, drugId: e.target.value})}
                >
                  <option value="" className="bg-slate-900">Select a batch in inventory...</option>
                  {drugs.filter(d => Number(d.remainingQty) > 0 && !d.isRecalled && Number(d.status) === 3).map(d => (
                    <option key={d.drugId} value={d.drugId} className="bg-slate-900">
                      {d.drugName} ({d.drugId}) - Avail: {Number(d.remainingQty)}
                    </option>
                  ))}
                </select>
                {drugs.find(d => d.drugId === dispatchData.drugId) && (
                  <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs flex justify-between items-center mt-2">
                    <span className="text-slate-400">Available Stock:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {Number(drugs.find(d => d.drugId === dispatchData.drugId).remainingQty).toLocaleString()} Units
                    </span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-teal-300 uppercase tracking-widest">Receiver (Wholesaler) ID</label>
                <input required 
                  className="w-full bg-black/40 border border-slate-700 rounded-lg px-4 py-3 text-teal-400 font-mono focus:ring-2 focus:ring-teal-500/50 outline-none transition-all" 
                  placeholder="e.g. WH-001" 
                  value={dispatchData.receiverId} 
                  onChange={e => setDispatchData({...dispatchData, receiverId: e.target.value})} 
                />
                {dispatchPreview?.receiver && (
                  <p className="text-xs text-emerald-400 mt-1">Found: {dispatchPreview.receiver.name} ({dispatchPreview.receiver.wallet.slice(0,6)}...)</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-teal-300 uppercase tracking-widest">Transporter ID</label>
                <input required 
                  className="w-full bg-black/40 border border-slate-700 rounded-lg px-4 py-3 text-teal-400 font-mono focus:ring-2 focus:ring-teal-500/50 outline-none transition-all" 
                  placeholder="e.g. TR-001" 
                  value={dispatchData.transporterId} 
                  onChange={e => setDispatchData({...dispatchData, transporterId: e.target.value})} 
                />
                {dispatchPreview?.transporter && (
                  <p className="text-xs text-emerald-400 mt-1">Found: {dispatchPreview.transporter.name} ({dispatchPreview.transporter.wallet.slice(0,6)}...)</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-teal-300 uppercase tracking-widest">Transfer Quantity</label>
                <input required type="number" min="1" 
                  className="w-full bg-black/40 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono focus:ring-2 focus:ring-teal-500/50 outline-none transition-all" 
                  value={dispatchData.quantity} 
                  onChange={e => setDispatchData({...dispatchData, quantity: e.target.value})} 
                />
                {drugs.find(d => d.drugId === dispatchData.drugId) && Number(dispatchData.quantity) > Number(drugs.find(d => d.drugId === dispatchData.drugId).remainingQty) && (
                  <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-lg text-xs text-red-200 font-bold flex items-start gap-2 mt-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>?? EXCEEDS AVAILABLE STOCK: You requested {Number(dispatchData.quantity).toLocaleString()} units, but only {Number(drugs.find(d => d.drugId === dispatchData.drugId).remainingQty).toLocaleString()} units remain. The blockchain will reject this!</span>
                  </div>
                )}
              </div>
              
              {dispatchPreview?.receiver && dispatchPreview?.transporter && dispatchData.drugId && (
                <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-xs space-y-1">
                   <div className="text-slate-400">Preview:</div>
                   <div className="text-white font-mono">Origin: {entityInfo.name}</div>
                   <div className="text-white font-mono">Dest: {dispatchPreview.receiver.name}</div>
                   <div className="text-white font-mono">Transporter: {dispatchPreview.transporter.name}</div>
                </div>
              )}

              {dispatchError && (
                <div className="p-3 bg-red-950/90 border border-red-500/60 rounded-lg text-xs text-red-200 font-mono flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{dispatchError}</span>
                </div>
              )}
              <button disabled={isLoading} className="w-full bg-teal-600 text-white font-black tracking-widest uppercase py-3 rounded-lg hover:bg-teal-500 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(20,184,166,0.4)] mt-2">
                Create & Dispatch
              </button>
            </form>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-900/50 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/10"
          >
            <div className="flex items-center mb-6">
              <Activity className="h-5 w-5 text-purple-400 mr-2" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Inventory Status</h3>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} width={30} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                  <Bar dataKey="Manufactured" fill="#475569" radius={[4,4,0,0]} barSize={12} />
                  <Bar dataKey="Remaining" fill="#3b82f6" radius={[4,4,0,0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-teal-500 to-purple-500"></div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-black text-white tracking-wide">Blockchain Ledger: Batch Inventory</h3>
            <p className="text-slate-400 text-sm mt-1">Immutable record of manufactured supply</p>
          </div>
          <div className="flex space-x-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-emerald-400 font-mono font-bold uppercase tracking-widest">Network Sync Active</span>
          </div>
        </div>
        
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-slate-300 text-xs uppercase tracking-widest">
                <th className="p-4 font-bold border-b border-white/10 rounded-tl-xl">Batch ID</th>
                <th className="p-4 font-bold border-b border-white/10">Nomenclature</th>
                <th className="p-4 font-bold border-b border-white/10">Total Minted</th>
                <th className="p-4 font-bold border-b border-white/10">Available Units</th>
                <th className="p-4 font-bold border-b border-white/10">Timestamp</th>
                <th className="p-4 font-bold border-b border-white/10 rounded-tr-xl">Network Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {drugs.map((row, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + (idx * 0.05) }}
                  key={row.drugId} 
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="p-4 font-mono text-blue-400 text-xs">{row.drugId}</td>
                  <td className="p-4 font-bold text-white">{row.drugName}</td>
                  <td className="p-4 text-slate-300 font-mono">{Number(row.manufacturedQty)}</td>
                  <td className="p-4 text-emerald-400 font-bold font-mono">{Number(row.remainingQty)}</td>
                  <td className="p-4 text-slate-400 font-mono text-xs">{formatDateTime(row.manufacturingDate)}</td>
                  <td className="p-4">
                    {row.isRecalled ? <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold border border-red-500/30">RECALLED</span> : 
                     Number(row.remainingQty) === 0 ? <span className="px-3 py-1 bg-slate-500/20 text-slate-400 rounded-full text-xs font-bold border border-slate-500/30">DEPLETED</span> :
                     <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">SECURE</span>}
                  </td>
                </motion.tr>
              ))}
              {drugs.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500 italic font-mono text-sm">No cryptographic batches minted yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-lg w-full"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Confirm Digital Minting</h2>
              <p className="text-slate-400 mb-6">Please verify the cryptographic details before signing the transaction to the blockchain. This action is immutable.</p>
              
              <div className="bg-black/50 p-4 rounded-xl border border-white/5 space-y-3 font-mono text-sm mb-8">
                <div className="flex justify-between"><span className="text-slate-500">Drug Name:</span><span className="text-blue-400 font-bold">{confirmModal.data.drugName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Batch ID:</span><span className="text-white">{confirmModal.data.drugId}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Quantity:</span><span className="text-emerald-400">{confirmModal.data.quantity} Units</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Expiry:</span><span className="text-red-400">{confirmModal.data.expiryDays} Days</span></div>
              </div>

              <div className="flex space-x-4">
                <button 
                  onClick={() => setConfirmModal({ isOpen: false, data: null })}
                  className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleManufactureConfirm}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-900/50 transition-all"
                >
                  Approve & Sign
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {successModal.isOpen && successModal.data && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-lg w-full relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                <CheckCircle2 className="w-16 h-16 text-emerald-500/20" />
              </div>
              <h2 className="text-2xl font-black text-emerald-400 mb-2">SHIPMENT CREATED</h2>
              <p className="text-slate-400 mb-6 text-sm">Please share this verification code securely with the transporter. The receiver will need it to verify and confirm receipt.</p>
              
              <div className="bg-black/50 p-4 rounded-xl border border-white/5 space-y-3 font-mono text-sm mb-6">
                <div className="flex justify-between"><span className="text-slate-500">Shipment ID:</span><span className="text-white">{successModal.data.shipmentId}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Batch ID:</span><span className="text-white">{successModal.data.drugId}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Quantity:</span><span className="text-emerald-400">{successModal.data.quantity} Units</span></div>
                <div className="flex justify-between"><span className="text-slate-500">From:</span><span className="text-white">{successModal.data.from}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">To:</span><span className="text-white">{successModal.data.to}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Transporter:</span><span className="text-white">{successModal.data.transporter}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Status:</span><span className="text-blue-400">{successModal.data.status}</span></div>
              </div>

              <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl flex flex-col items-center justify-center mb-6">
                <p className="text-xs text-emerald-400 uppercase tracking-widest font-bold mb-2">Delivery Verification Code</p>
                <div className="flex items-center space-x-3">
                  <span className="text-3xl font-black text-white tracking-widest">{successModal.data.verificationCode}</span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(successModal.data.verificationCode)}
                    className="p-2 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 rounded-lg transition-colors"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex justify-center mb-6 bg-white p-4 rounded-xl">
                 <QRCodeSVG 
                    value={`${window.location.origin}/verify/shipment/${successModal.data.shipmentId}`}
                    size={128}
                 />
              </div>

              <button 
                onClick={() => setSuccessModal({ isOpen: false, data: null })}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors uppercase tracking-widest"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManufacturerDashboard;
