import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useTransaction } from '../hooks/useTransaction';
import { useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, FileText, FlaskConical, TestTube, AlertTriangle, ShieldCheck, ClipboardCheck, Activity } from 'lucide-react';
import { formatDateTime } from '../utils/helpers';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const QualityOfficerDashboard = () => {
  const { contract, account } = useWeb3();
  const { execute, isLoading } = useTransaction();
  const location = useLocation();
  
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [history, setHistory] = useState([]);
  const [comments, setComments] = useState('');
  const [isFetching, setIsFetching] = useState(true);

  const fetchDrugs = async () => {
    setIsFetching(true);
    if (!contract) return;
    try {
      const allDrugs = await contract.getAllDrugs();
      const pending = allDrugs.filter(d => Number(d.status) === 1 && d.exists); // QUALITY_PENDING
      const past = allDrugs.filter(d => Number(d.status) > 1 && d.exists);
      
      setPendingApprovals(pending);
      setHistory(past);
    } catch (err) {
      console.error('Failed to fetch drugs', err);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchDrugs();
  }, [contract]);

  const handleApprove = async () => {
    if (!selectedBatch) return;
    const success = await execute('approveDrug', selectedBatch.drugId, comments || 'Approved');
    if (success) {
      setSelectedBatch(null);
      setComments('');
      fetchDrugs();
    }
  };

  const handleReject = async () => {
    if (!selectedBatch) return;
    const success = await execute('rejectDrug', selectedBatch.drugId, comments || 'Rejected');
    if (success) {
      setSelectedBatch(null);
      setComments('');
      fetchDrugs();
    }
  };

  const loadDemoData = () => {
    setPendingApprovals([
      { drugId: 'BATCH-2026-X99', drugName: 'Amoxicillin 500mg', manufacturerId: 'MFG-GLOBAL-01', status: 1, exists: true },
      { drugId: 'BATCH-2026-Y42', drugName: 'Lisinopril 10mg', manufacturerId: 'MFG-BIO-04', status: 1, exists: true }
    ]);
    setHistory([
      { drugId: 'BATCH-2025-A11', drugName: 'Paracetamol 500mg', manufacturerId: 'MFG-GLOBAL-01', manufacturingDate: Date.now()/1000 - 864000, isRecalled: false, exists: true, status: 2 },
      { drugId: 'BATCH-2025-B22', drugName: 'Contaminated Syrup', manufacturerId: 'MFG-SHADY-99', manufacturingDate: Date.now()/1000 - 400000, isRecalled: true, exists: true, status: 2 },
      { drugId: 'BATCH-2026-C33', drugName: 'Atorvastatin 20mg', manufacturerId: 'MFG-BIO-04', manufacturingDate: Date.now()/1000 - 100000, isRecalled: false, exists: true, status: 2 }
    ]);
  };

  // Mock charts
  const pieData = [
    { name: 'Pending', value: pendingApprovals.length > 0 ? pendingApprovals.length : 1 },
    { name: 'Approved', value: history.filter(d => !d.isRecalled).length > 0 ? history.filter(d => !d.isRecalled).length : 42 },
    { name: 'Rejected', value: history.filter(d => d.isRecalled).length > 0 ? history.filter(d => d.isRecalled).length : 3 }
  ];
  const COLORS = ['#f59e0b', '#10b981', '#ef4444'];

  const renderCommandCenter = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 overflow-y-auto pb-8 space-y-6">
      
      <div className="flex justify-end mb-4">
        <button onClick={loadDemoData} className="px-6 py-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl font-bold tracking-widest text-xs uppercase transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)]">
          Inject Demo Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] -mr-16 -mt-16"></div>
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl"><FlaskConical className="w-6 h-6" /></div>
            <h3 className="text-slate-400 font-bold tracking-widest text-xs uppercase">Pending Reviews</h3>
          </div>
          <p className="text-4xl font-black text-white">{pendingApprovals.length}</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] -mr-16 -mt-16"></div>
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl"><CheckCircle className="w-6 h-6" /></div>
            <h3 className="text-slate-400 font-bold tracking-widest text-xs uppercase">Batches Approved</h3>
          </div>
          <p className="text-4xl font-black text-white">{history.filter(d => !d.isRecalled).length || 42}</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl relative overflow-hidden group hover:border-red-500/30 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-[40px] -mr-16 -mt-16"></div>
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-red-500/20 text-red-400 rounded-xl"><XCircle className="w-6 h-6" /></div>
            <h3 className="text-slate-400 font-bold tracking-widest text-xs uppercase">Batches Rejected</h3>
          </div>
          <p className="text-4xl font-black text-white">{history.filter(d => d.isRecalled).length || 3}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl h-[400px] flex flex-col">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center"><Activity className="w-5 h-5 mr-2 text-purple-400" /> Quality Assurance Metrics</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} dataKey="value" stroke="rgba(255,255,255,0.1)" strokeWidth={2}>
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Legend wrapperStyle={{ color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderQueue = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 overflow-y-auto pb-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4 mb-8">
          <TestTube className="w-8 h-8 text-purple-400" />
          <h2 className="text-3xl font-black text-white tracking-tight">Pending Reviews</h2>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          {pendingApprovals.length === 0 ? (
            <div className="p-16 flex flex-col items-center text-center">
              <CheckCircle className="w-16 h-16 text-emerald-500/50 mb-4" />
              <h3 className="text-xl font-bold text-white">Queue is Empty</h3>
              <p className="text-slate-400 mt-2">All manufacturing batches have been reviewed and certified.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {pendingApprovals.map((batch, i) => (
                <div key={i} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-white/5 transition-colors">
                  <div className="mb-4 sm:mb-0">
                    <div className="flex items-center">
                      <h4 className="text-xl font-bold text-white">{batch.drugName}</h4>
                      <span className="ml-4 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Pending QA
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-slate-400 font-mono flex items-center">
                      Batch ID: <span className="text-slate-300 ml-2">{batch.drugId}</span>
                    </div>
                    <div className="mt-1 text-sm text-slate-400 font-mono flex items-center">
                      Manufacturer: <span className="text-slate-300 ml-2">{batch.manufacturerId}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedBatch(batch)}
                    className="px-6 py-3 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/50 rounded-xl font-bold tracking-widest text-xs uppercase transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                  >
                    Review & Certify
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  const renderInspections = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8 flex flex-col overflow-y-auto">
      <div className="flex items-center space-x-4 mb-8">
        <ClipboardCheck className="w-8 h-8 text-purple-400" />
        <h2 className="text-3xl font-black text-white tracking-tight">Inspection Ledger</h2>
      </div>
      
      <div className="flex-1 overflow-x-auto rounded-xl border border-white/5 bg-black/40">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 text-slate-300 text-xs uppercase tracking-widest">
              <th className="p-4 font-bold border-b border-white/10 rounded-tl-xl">Batch ID</th>
              <th className="p-4 font-bold border-b border-white/10">Medication Name</th>
              <th className="p-4 font-bold border-b border-white/10">Manufacturer</th>
              <th className="p-4 font-bold border-b border-white/10">Mfg Date</th>
              <th className="p-4 font-bold border-b border-white/10 rounded-tr-xl">Resolution</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {history.map((drug, idx) => (
              <tr key={drug.drugId + idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 text-slate-400 font-mono text-xs">{drug.drugId}</td>
                <td className="p-4 text-white font-bold">{drug.drugName}</td>
                <td className="p-4 text-slate-300 font-mono text-xs">{drug.manufacturerId}</td>
                <td className="p-4 text-slate-400 font-mono text-xs">{formatDateTime(drug.manufacturingDate).split(',')[0]}</td>
                <td className="p-4">
                  {drug.isRecalled ? (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-bold uppercase inline-flex items-center"><XCircle className="w-3 h-3 mr-1"/> Rejected</span>
                  ) : (
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-bold uppercase inline-flex items-center"><ShieldCheck className="w-3 h-3 mr-1"/> Certified</span>
                  )}
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500">No past inspections found on the ledger.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] flex-1 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>
      
      <div className="flex-1 min-h-0 relative">
        <div className={`absolute inset-0 transition-all duration-300 ${location.pathname === '/quality-officer' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          {renderCommandCenter()}
        </div>
        <div className={`absolute inset-0 transition-all duration-300 ${location.pathname === '/quality-officer/queue' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          {renderQueue()}
        </div>
        <div className={`absolute inset-0 transition-all duration-300 ${location.pathname === '/quality-officer/inspections' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          {renderInspections()}
        </div>
      </div>

      {/* Certification Modal */}
      <AnimatePresence>
        {selectedBatch && (
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
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[40px] -mr-24 -mt-24 pointer-events-none"></div>
              
              <h3 className="text-2xl font-black text-white mb-2 relative z-10">Quality Certification</h3>
              <p className="text-slate-400 text-sm mb-6 relative z-10">Sign cryptographic approval or rejection for the selected manufacturing batch.</p>

              <div className="bg-black/40 border border-white/5 rounded-xl p-4 mb-6 relative z-10">
                <h4 className="font-bold text-white mb-1">{selectedBatch.drugName}</h4>
                <p className="font-mono text-xs text-purple-400">BATCH: {selectedBatch.drugId}</p>
              </div>
              
              <div className="space-y-4 mb-8 relative z-10">
                <div className="flex items-center justify-between p-4 border border-white/10 bg-white/5 rounded-xl">
                  <div className="flex items-center text-sm text-slate-300"><FileText className="h-4 w-4 mr-2 text-slate-400"/> Certificate of Analysis</div>
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Valid</span>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Cryptographic Signature Comments</label>
                  <textarea 
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all" 
                    rows="3"
                    placeholder="Enter approval or rejection justification..."
                  />
                </div>
              </div>

              <div className="flex gap-4 relative z-10">
                <button 
                  onClick={handleReject}
                  disabled={isLoading}
                  className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold tracking-widest text-xs uppercase py-4 rounded-xl transition-all flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                >
                  <XCircle className="mr-2 h-4 w-4" /> Reject Batch
                </button>
                <button 
                  onClick={handleApprove}
                  disabled={isLoading}
                  className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold tracking-widest text-xs uppercase py-4 rounded-xl transition-all flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                >
                  <ShieldCheck className="mr-2 h-4 w-4" /> Certify Safe
                </button>
              </div>
              
              <button 
                onClick={() => {setSelectedBatch(null); setComments('');}}
                className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QualityOfficerDashboard;
