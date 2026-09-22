import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useTransaction } from '../hooks/useTransaction';
import { ShieldAlert, FileText, AlertTriangle, ShieldCheck, Activity, Search, Database } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const RegulatorDashboard = () => {
  const { contract } = useWeb3();
  const { execute, isLoading } = useTransaction();
  
  const [stats, setStats] = useState({ total: 0, active: 0, recalled: 0, quarantined: 0, expired: 0, violations: 0 });
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);

  const handleResolveIncident = () => {
    if (!selectedIncident) return;
    // Visually resolve the incident for the demo
    setIncidents(prev => prev.filter(i => i.id !== selectedIncident.id));
    setSelectedIncident(null);
  };

  const fetchData = async () => {
    if (!contract) return;
    try {
      const allDrugs = await contract.getAllDrugs();
      
      let total = 0;
      let active = 0;
      let recalled = 0;
      let quarantined = 0;
      let expired = 0;
      
      const incidentsData = [];

      allDrugs.forEach(drug => {
        if (!drug.exists) return;
        total++;
        
        const isExpired = (Number(drug.expiryDate) * 1000) < Date.now();
        const status = Number(drug.status);

        if (drug.isRecalled || status === 10) { // RECALLED
          recalled++;
          incidentsData.push({
            id: `INC-REC-${drug.drugId}`,
            drug: drug.drugId,
            type: 'Recall',
            entity: drug.currentOwnerId,
            severity: 'High'
          });
        } else if (isExpired) {
          expired++;
        } else if (status === 7) { // QUARANTINED
          quarantined++;
          incidentsData.push({
            id: `INC-QUA-${drug.drugId}`,
            drug: drug.drugId,
            type: 'Quarantined',
            entity: drug.currentOwnerId,
            severity: 'Medium'
          });
        } else if (status === 3 || status === 4 || status === 5) { // AVAILABLE, IN_TRANSIT, DELIVERED
          active++;
        }
        
        if (status === 6) { // FLAGGED
          incidentsData.push({
            id: `INC-FLG-${drug.drugId}`,
            drug: drug.drugId,
            type: 'Flagged',
            entity: drug.currentOwnerId,
            severity: 'Medium'
          });
        }
      });

      setStats({
        total,
        active,
        recalled,
        quarantined,
        expired,
        violations: incidentsData.length
      });
      setIncidents(incidentsData);
      
    } catch (err) {
      console.error("Error fetching regulator data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [contract]);

  const loadDemoData = () => {
    setStats({ total: 12450, active: 11800, recalled: 42, quarantined: 156, expired: 452, violations: 198 });
    setIncidents([
      { id: 'INC-REC-AMOX-001', drug: 'AMOX-2026-001', type: 'Active Recall', entity: 'XYZ Wholesalers', severity: 'High' },
      { id: 'INC-QUA-METF-042', drug: 'METF-2026-042', type: 'Quarantined', entity: 'FastMed Logistics', severity: 'Medium' },
      { id: 'INC-FLG-PARA-991', drug: 'PARA-2026-991', type: 'Flagged Temp', entity: 'CityCare Pharmacy', severity: 'Medium' },
      { id: 'INC-REC-SYRP-088', drug: 'SYRP-2025-088', type: 'Active Recall', entity: 'MFG-SHADY-99', severity: 'High' }
    ]);
  };

  const handleApproveRecall = async (drugId) => {
    const success = await execute('approveRecall', drugId);
    if (success) fetchData();
  };

  const pieData = [
    { name: 'Active', value: stats.active },
    { name: 'Expired', value: stats.expired },
    { name: 'Quarantined', value: stats.quarantined },
    { name: 'Recalled', value: stats.recalled },
  ].filter(d => d.value > 0);
  
  const COLORS = ['#10b981', '#94a3b8', '#f59e0b', '#ef4444'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 overflow-y-auto pb-8 space-y-6 flex-1 min-h-0 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>
      
      {/* Header Banner */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>
        
        <div className="relative z-10 mb-6 md:mb-0">
          <div className="flex items-center space-x-4 mb-2">
            <ShieldAlert className="w-8 h-8 text-blue-400" />
            <h2 className="text-3xl font-black text-white tracking-tight">Regulatory Oversight Center</h2>
          </div>
          <p className="text-slate-400 text-sm ml-12">Real-time cryptographic monitoring of the national pharmaceutical supply chain.</p>
        </div>

        <div className="flex gap-4 relative z-10">
          <button onClick={loadDemoData} className="px-6 py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl font-bold tracking-widest text-xs uppercase transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            Inject Demo Data
          </button>
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold tracking-widest text-xs uppercase transition-all flex items-center shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-500 hover:scale-105">
            <FileText className="w-4 h-4 mr-2" /> Compliance Report
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Batches', value: stats.total, color: 'border-slate-500', glow: '' },
          { label: 'Active Status', value: stats.active, color: 'border-emerald-500', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.1)]' },
          { label: 'Active Recalls', value: stats.recalled, color: 'border-red-500', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.1)]' },
          { label: 'Quarantined', value: stats.quarantined, color: 'border-amber-500', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.1)]' },
          { label: 'Expired Supply', value: stats.expired, color: 'border-slate-500', glow: '' },
          { label: 'Total Incidents', value: stats.violations, color: 'border-purple-500', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.1)]' }
        ].map((s, i) => (
          <div key={i} className={`bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-white/5 border-b-4 ${s.color} ${s.glow} transition-all hover:bg-white/5`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
            <p className="text-3xl font-black text-white mt-2">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incidents Table */}
        <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white flex items-center"><AlertTriangle className="mr-3 text-amber-500 w-6 h-6" /> Active Investigations</h3>
            <button className="text-xs font-bold tracking-widest uppercase text-blue-400 hover:text-blue-300 transition-colors">View All</button>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-slate-300 text-xs uppercase tracking-widest">
                  <th className="px-4 py-4 font-bold border-b border-white/10 rounded-tl-xl">Incident ID</th>
                  <th className="px-4 py-4 font-bold border-b border-white/10">Batch</th>
                  <th className="px-4 py-4 font-bold border-b border-white/10">Type</th>
                  <th className="px-4 py-4 font-bold border-b border-white/10">Severity</th>
                  <th className="px-4 py-4 font-bold border-b border-white/10 rounded-tr-xl">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {incidents.length > 0 ? incidents.map((inc, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4 font-mono text-slate-400 text-xs">{inc.id}</td>
                    <td className="px-4 py-4 font-bold text-white">{inc.drug}</td>
                    <td className="px-4 py-4 text-slate-300">{inc.type}</td>
                    <td className="px-4 py-4">
                      {inc.severity === 'High' && <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-bold uppercase inline-flex items-center">Critical</span>}
                      {inc.severity === 'Medium' && <span className="px-2 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-xs font-bold uppercase inline-flex items-center">Warning</span>}
                      {inc.severity !== 'High' && inc.severity !== 'Medium' && <span className="px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-xs font-bold uppercase inline-flex items-center">{inc.severity}</span>}
                    </td>
                    <td className="px-4 py-4">
                      {inc.type.includes('Recall') ? (
                        <button 
                          onClick={() => setSelectedIncident(inc)}
                          className="text-xs font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
                        >
                          Enforce Recall
                        </button>
                      ) : (
                        <button onClick={() => setSelectedIncident(inc)} className="text-xs font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors">Investigate</button>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-slate-500">No active incidents found on the network.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 flex flex-col h-[400px] lg:h-auto">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center"><Activity className="w-5 h-5 mr-2 text-emerald-400" /> Network Distribution</h3>
          <div className="flex-1 min-h-0 relative">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} dataKey="value" stroke="rgba(255,255,255,0.1)" strokeWidth={2}>
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                  <Legend wrapperStyle={{ color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500 italic">No blockchain data available</div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedIncident && (
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
              <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-[40px] -mr-24 -mt-24 pointer-events-none ${selectedIncident.type.includes('Recall') ? 'bg-red-500/20' : 'bg-amber-500/20'}`}></div>
              
              <h3 className="text-2xl font-black text-white mb-2 relative z-10 flex items-center">
                <AlertTriangle className={`w-6 h-6 mr-3 ${selectedIncident.type.includes('Recall') ? 'text-red-500' : 'text-amber-500'}`} />
                {selectedIncident.type.includes('Recall') ? 'Enforce Network Recall' : 'Initiate Investigation'}
              </h3>
              <p className="text-slate-400 text-sm mb-6 relative z-10">Cryptographic audit trail and regulatory action.</p>

              <div className="bg-black/40 border border-white/5 rounded-xl p-4 mb-6 relative z-10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Target Batch</span>
                  <span className="font-mono text-xs text-white">{selectedIncident.drug}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Current Custodian</span>
                  <span className="font-bold text-white text-sm">{selectedIncident.entity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase">Incident ID</span>
                  <span className="font-mono text-xs text-blue-400">{selectedIncident.id}</span>
                </div>
              </div>
              
              <div className="relative z-10">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Regulatory Decree Notes</label>
                <textarea 
                  rows="3"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all mb-6"
                  placeholder="Enter official regulatory findings or justification..."
                />
                <div className="flex gap-4">
                  <button onClick={() => setSelectedIncident(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold tracking-widest text-xs uppercase py-4 rounded-xl transition-all">
                    Cancel
                  </button>
                  <button onClick={handleResolveIncident} className={`flex-1 text-white font-bold tracking-widest text-xs uppercase py-4 rounded-xl transition-all flex justify-center items-center ${selectedIncident.type.includes('Recall') ? 'bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-amber-600 hover:bg-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.4)]'}`}>
                    {selectedIncident.type.includes('Recall') ? 'Execute Recall' : 'Issue Quarantine'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RegulatorDashboard;
