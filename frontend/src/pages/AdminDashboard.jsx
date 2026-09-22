import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useTransaction } from '../hooks/useTransaction';
import { ShieldAlert, UserX, UserCheck, AlertTriangle, Users, Package, Database, Activity, Server, Network } from 'lucide-react';
import { getRoleLabel } from '../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard = () => {
  const { contract } = useWeb3();
  const { execute, isLoading } = useTransaction();
  const [entities, setEntities] = useState([]);
  const [drugs, setDrugs] = useState([]);
  
  const [recallTarget, setRecallTarget] = useState(null);
  const [recallReason, setRecallReason] = useState('');

  const fetchData = async () => {
    if (!contract) return;
    try {
      const allEnts = await contract.getAllEntities();
      setEntities(allEnts.filter(e => e.isRegistered));
      
      const allDrugs = await contract.getAllDrugs();
      setDrugs(allDrugs.filter(d => d.exists));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [contract]);

  const loadDemoData = () => {
    setEntities([
      { id: 'MFR-001', name: 'ABC Pharmaceuticals', role: 1, wallet: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', isActive: true },
      { id: 'WHL-001', name: 'XYZ Wholesalers', role: 2, wallet: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', isActive: true },
      { id: 'RTL-001', name: 'CityCare Pharmacy', role: 3, wallet: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', isActive: true },
      { id: 'REG-001', name: 'Drug Regulatory Authority', role: 6, wallet: '0x976EA74026E726554dB657fA54763abd0C3a0aa9', isActive: true },
      { id: 'BAD-999', name: 'Shady Distributors LLC', role: 2, wallet: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955', isActive: false }
    ]);
    setDrugs([
      { drugId: 'BATCH-2026-X99', drugName: 'Amoxicillin 500mg', manufacturerId: 'MFR-001', isRecalled: false },
      { drugId: 'BATCH-2026-Y42', drugName: 'Lisinopril 10mg', manufacturerId: 'MFR-001', isRecalled: false },
      { drugId: 'BATCH-2025-A11', drugName: 'Paracetamol 500mg', manufacturerId: 'MFR-001', isRecalled: false },
      { drugId: 'BATCH-2025-BAD', drugName: 'Contaminated Syrup', manufacturerId: 'BAD-999', isRecalled: true }
    ]);
  };

  const toggleEntityStatus = async (id, currentStatus) => {
    const method = currentStatus ? 'suspendEntity' : 'activateEntity';
    const success = await execute(method, id);
    if (success) fetchData();
  };

  const handleRecall = async (e) => {
    e.preventDefault();
    if (!recallTarget) return;
    const success = await execute('recallDrug', recallTarget.drugId, recallReason);
    if (success) {
      setRecallTarget(null);
      setRecallReason('');
      fetchData();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 overflow-y-auto pb-8 space-y-6 flex-1 min-h-0 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-rose-900/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>
      
      {/* Header Banner */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>
        
        <div className="relative z-10 mb-6 md:mb-0">
          <div className="flex items-center space-x-4 mb-2">
            <Server className="w-8 h-8 text-rose-400" />
            <h2 className="text-3xl font-black text-white tracking-tight">System Administration</h2>
          </div>
          <p className="text-slate-400 text-sm ml-12">Manage network entities, global operations, and smart contract state.</p>
        </div>

        <div className="flex gap-4 relative z-10">
          <button onClick={loadDemoData} className="px-6 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl font-bold tracking-widest text-xs uppercase transition-all shadow-[0_0_15px_rgba(244,63,94,0.2)]">
            Inject Demo Data
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Registered Entities', value: entities.length, icon: Users, color: 'text-blue-400', border: 'border-blue-500/30' },
          { label: 'Active Network Nodes', value: entities.filter(e => e.isActive).length, icon: Network, color: 'text-emerald-400', border: 'border-emerald-500/30' },
          { label: 'Total Drug Batches', value: drugs.length, icon: Package, color: 'text-amber-400', border: 'border-amber-500/30' },
          { label: 'Global Recalls', value: drugs.filter(d => d.isRecalled).length, icon: AlertTriangle, color: 'text-red-400', border: 'border-red-500/30' }
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-white/5 border-b-4 hover:bg-white/5 transition-all ${s.border}`}>
              <div className="flex justify-between items-start mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-1/2 leading-tight">{s.label}</p>
                <Icon className={`w-6 h-6 ${s.color}`} />
              </div>
              <p className="text-4xl font-black text-white">{s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Entity Management */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white flex items-center"><Users className="mr-3 text-blue-400 w-6 h-6" /> Entity Management</h3>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-slate-300 text-xs uppercase tracking-widest">
                  <th className="px-4 py-4 font-bold border-b border-white/10 rounded-tl-xl">ID</th>
                  <th className="px-4 py-4 font-bold border-b border-white/10">Entity Name</th>
                  <th className="px-4 py-4 font-bold border-b border-white/10">Role</th>
                  <th className="px-4 py-4 font-bold border-b border-white/10">Status</th>
                  <th className="px-4 py-4 font-bold border-b border-white/10 rounded-tr-xl">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {entities.map((r, i) => (
                  <tr key={r.id + i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4 font-mono text-slate-400 text-xs">{r.id}</td>
                    <td className="px-4 py-4 font-bold text-white">{r.name}</td>
                    <td className="px-4 py-4 text-slate-300 text-xs uppercase tracking-wider">{getRoleLabel(Number(r.role))}</td>
                    <td className="px-4 py-4">
                      {r.isActive 
                        ? <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-bold uppercase inline-flex items-center shadow-[0_0_10px_rgba(16,185,129,0.1)]">Active</span>
                        : <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-bold uppercase inline-flex items-center shadow-[0_0_10px_rgba(239,68,68,0.1)]">Suspended</span>
                      }
                    </td>
                    <td className="px-4 py-4">
                      <button 
                        onClick={() => toggleEntityStatus(r.id, r.isActive)}
                        disabled={isLoading}
                        className={`text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 inline-flex items-center ${r.isActive ? 'text-red-400 hover:text-red-300' : 'text-emerald-400 hover:text-emerald-300'}`}
                      >
                        {r.isActive ? <><UserX className="w-3 h-3 mr-1"/> Suspend</> : <><UserCheck className="w-3 h-3 mr-1"/> Activate</>}
                      </button>
                    </td>
                  </tr>
                ))}
                {entities.length === 0 && (
                  <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500">No entities registered on network.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Drug Registry */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white flex items-center"><ShieldAlert className="mr-3 text-rose-400 w-6 h-6" /> Global Drug Registry</h3>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-slate-300 text-xs uppercase tracking-widest">
                  <th className="px-4 py-4 font-bold border-b border-white/10 rounded-tl-xl">Batch ID</th>
                  <th className="px-4 py-4 font-bold border-b border-white/10">Nomenclature</th>
                  <th className="px-4 py-4 font-bold border-b border-white/10">Mfg ID</th>
                  <th className="px-4 py-4 font-bold border-b border-white/10">Status</th>
                  <th className="px-4 py-4 font-bold border-b border-white/10 rounded-tr-xl">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {drugs.map((r, i) => (
                  <tr key={r.drugId + i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4 font-mono text-slate-400 text-xs">{r.drugId}</td>
                    <td className="px-4 py-4 font-bold text-white">{r.drugName}</td>
                    <td className="px-4 py-4 text-slate-300 text-xs font-mono">{r.manufacturerId}</td>
                    <td className="px-4 py-4">
                      {r.isRecalled 
                        ? <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-bold uppercase inline-flex items-center shadow-[0_0_10px_rgba(239,68,68,0.1)]">Recalled</span>
                        : <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-bold uppercase inline-flex items-center shadow-[0_0_10px_rgba(16,185,129,0.1)]">Active</span>
                      }
                    </td>
                    <td className="px-4 py-4">
                      {!r.isRecalled && (
                        <button 
                          onClick={() => setRecallTarget(r)}
                          className="text-xs font-bold uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-colors inline-flex items-center"
                        >
                          <AlertTriangle className="w-3 h-3 mr-1"/> Issue Recall
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {drugs.length === 0 && (
                  <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500">No drug batches minted yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recall Modal */}
      <AnimatePresence>
        {recallTarget && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 20 }} 
              className="bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-8 max-w-lg w-full relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/10 rounded-full blur-[40px] -mr-24 -mt-24 pointer-events-none"></div>
              
              <h3 className="text-2xl font-black text-white mb-2 relative z-10 flex items-center">
                <AlertTriangle className="w-6 h-6 mr-3 text-red-500" />
                Emergency Global Recall
              </h3>
              <p className="text-slate-400 text-sm mb-6 relative z-10">You are about to issue a permanent network-wide recall.</p>

              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 relative z-10">
                <p className="text-sm text-red-400 font-medium leading-relaxed">
                  This action is irreversible and will quarantine all instances of <span className="font-bold text-white">{recallTarget.drugName}</span> (Batch <span className="font-mono text-white">{recallTarget.drugId}</span>) across the entire supply chain.
                </p>
              </div>
              
              <form onSubmit={handleRecall} className="relative z-10">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Recall Justification</label>
                <textarea 
                  required
                  rows="3"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all mb-6"
                  placeholder="e.g. Critical quality control failure discovered..."
                  value={recallReason}
                  onChange={(e) => setRecallReason(e.target.value)}
                />
                <div className="flex gap-4">
                  <button type="button" onClick={() => setRecallTarget(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold tracking-widest text-xs uppercase py-4 rounded-xl transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={isLoading} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold tracking-widest text-xs uppercase py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] disabled:opacity-50">
                    Execute Recall
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminDashboard;
