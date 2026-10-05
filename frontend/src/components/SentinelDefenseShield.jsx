import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, Radio, Lock, Unlock, Eye, RefreshCw, X, FileWarning } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { useTransaction } from '../hooks/useTransaction';
import toast from 'react-hot-toast';

const SentinelDefenseShield = ({ isOpen, onClose }) => {
  const { contract, entityInfo } = useWeb3();
  const { execute, isLoading } = useTransaction();

  const [radar, setRadar] = useState(null);
  const [activeTab, setActiveTab] = useState('radar'); // 'radar', 'quarantine', 'tamper', 'release'
  const [quarantineData, setQuarantineData] = useState({ drugId: '', reason: '' });
  const [tamperData, setTamperData] = useState({ drugId: '', sealId: '', description: '', evidenceCid: 'IPFS-SEAL-VERIFY-001' });
  const [releaseData, setReleaseData] = useState({ drugId: '', note: '' });

  const fetchRadar = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/security/radar');
      if (res.ok) {
        const data = await res.json();
        setRadar(data);
      }
    } catch (e) {
      console.warn("Could not reach Sentinel Radar API", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRadar();
      const interval = setInterval(fetchRadar, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleEmergencyQuarantine = async (e) => {
    e.preventDefault();
    if (!quarantineData.drugId) return;
    try {
      const success = await execute('emergencyQuarantine', quarantineData.drugId, quarantineData.reason || 'Cryptographic regulatory quarantine decree');
      if (success) {
        toast.success(`Batch ${quarantineData.drugId} successfully quarantined on-chain!`);
        setQuarantineData({ drugId: '', reason: '' });
        fetchRadar();
      }
    } catch (err) {
      console.error(err);
      toast.error('Quarantine execution failed: ' + (err.reason || err.message));
    }
  };

  const handleReportTamper = async (e) => {
    e.preventDefault();
    if (!tamperData.drugId || !tamperData.sealId) return;
    try {
      const success = await execute(
        'reportTampering',
        tamperData.drugId,
        tamperData.sealId,
        tamperData.description || 'Physical packaging seal breached',
        tamperData.evidenceCid || 'IPFS-SEAL-001'
      );
      if (success) {
        toast.success(`Tamper report registered! Batch ${tamperData.drugId} is now locked & quarantined.`);
        setTamperData({ drugId: '', sealId: '', description: '', evidenceCid: 'IPFS-SEAL-VERIFY-001' });
        fetchRadar();
      }
    } catch (err) {
      console.error(err);
      toast.error('Tamper registration failed: ' + (err.reason || err.message));
    }
  };

  const handleReleaseQuarantine = async (e) => {
    e.preventDefault();
    if (!releaseData.drugId) return;
    try {
      const success = await execute('releaseQuarantine', releaseData.drugId, releaseData.note || 'Compliance verified');
      if (success) {
        toast.success(`Batch ${releaseData.drugId} quarantine released on-chain.`);
        setReleaseData({ drugId: '', note: '' });
        fetchRadar();
      }
    } catch (err) {
      console.error(err);
      toast.error('Release failed: ' + (err.reason || err.message));
    }
  };

  if (!isOpen) return null;

  const isRegulator = entityInfo?.role === 6 || entityInfo?.roleName === 'Regulator';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-4xl bg-slate-900 border border-teal-500/30 rounded-3xl shadow-[0_0_50px_rgba(20,184,166,0.2)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-slate-950/50 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-black text-white tracking-wide">SENTINEL DEFENSE & COMPLIANCE SHIELD</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  REAL-TIME v2.4
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Multi-Layer Cryptographic Security, GPS Anti-Spoofing & Tamper-Proof Invariants</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Threat Level Banner */}
        <div className="px-6 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-white/5 flex flex-wrap items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <Radio className="w-4 h-4 text-emerald-400 animate-ping" />
            <span className="text-slate-400">Security Threat Level:</span>
            <span className={`font-mono font-black uppercase px-3 py-1 rounded-lg ${
              radar?.threatLevel?.includes('CRITICAL') ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
              radar?.threatLevel?.includes('ELEVATED') ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}>
              {radar?.threatLevel || 'DEFCON 5 - NORMAL'}
            </span>
          </div>

          <div className="flex items-center space-x-4 text-slate-300 font-mono">
            <span>Spoof Defenses: <strong className="text-teal-300">{radar?.spoofingAttempts || 0}</strong></span>
            <span>Brute-Force Blocks: <strong className="text-indigo-300">{radar?.bruteForceBlocks || 0}</strong></span>
            <span>Active Incidents: <strong className="text-amber-300">{radar?.totalIncidents || 0}</strong></span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-slate-950/30 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('radar')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
              activeTab === 'radar' ? 'bg-slate-900 border-white/20 text-teal-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sentinel Threat Feed
          </button>
          <button
            onClick={() => setActiveTab('quarantine')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
              activeTab === 'quarantine' ? 'bg-slate-900 border-white/20 text-red-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Emergency Quarantine
          </button>
          <button
            onClick={() => setActiveTab('tamper')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
              activeTab === 'tamper' ? 'bg-slate-900 border-white/20 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Report Seal Tampering
          </button>
          {isRegulator && (
            <button
              onClick={() => setActiveTab('release')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
                activeTab === 'release' ? 'bg-slate-900 border-white/20 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Release Quarantine (Regulator)
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'radar' && (
            <div className="space-y-6">
              {/* Active Defense Shield Badges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(radar?.activeShields || [
                  'EVM Smart Contract Invariant Lock',
                  'Sentinel Real-Time GPS Anti-Spoofing',
                  'Cryptographic Tamper-Evident Seal Registry',
                  'Anti-Brute-Force Scan Lockout Engine'
                ]).map((shield, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center space-x-3">
                    <ShieldCheck className="w-5 h-5 text-teal-400 flex-shrink-0" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-200">{shield}</h5>
                      <p className="text-[10px] text-teal-400 font-mono">Status: ACTIVE & ENFORCING</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Incidents Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Intercepted Telemetry & Anomaly Stream</h4>
                <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/30">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-white/5 text-slate-400">
                        <th className="p-3">Type</th>
                        <th className="p-3">Severity</th>
                        <th className="p-3">Target Reference</th>
                        <th className="p-3">Details</th>
                        <th className="p-3">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(radar?.recentIncidents || []).map((inc, i) => (
                        <tr key={i} className="hover:bg-white/5 font-mono">
                          <td className="p-3 font-bold text-teal-300">{inc.type}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              (inc.severity || '').toUpperCase() === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              (inc.severity || '').toUpperCase() === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}>
                              {inc.severity}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300">{inc.shipmentId || inc.batchId || 'System'}</td>
                          <td className="p-3 font-sans text-slate-300 max-w-xs truncate">{inc.message}</td>
                          <td className="p-3 text-slate-500 text-[10px]">{inc.timestamp}</td>
                        </tr>
                      ))}
                      {(!radar?.recentIncidents || radar.recentIncidents.length === 0) && (
                        <tr>
                          <td colSpan="5" className="p-6 text-center text-slate-500 font-sans italic">
                            No security incidents logged. All cryptographic invariants green.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'quarantine' && (
            <form onSubmit={handleEmergencyQuarantine} className="max-w-xl mx-auto space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start space-x-3 text-red-300 text-xs">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p>
                  Emergency quarantine immediately invokes <code className="text-red-200">emergencyQuarantine()</code> on the smart contract, halting all retail dispensing, wholesale distribution, and shipment handoffs immediately across all nodes.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Batch ID</label>
                <input
                  required
                  placeholder="e.g. PARA-2026-001"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono outline-none focus:ring-2 focus:ring-red-500"
                  value={quarantineData.drugId}
                  onChange={e => setQuarantineData({ ...quarantineData, drugId: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Quarantine Rationale</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Detail the suspected issue (e.g. Broken cold chain, reported side effects, unverified custody)..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  value={quarantineData.reason}
                  onChange={e => setQuarantineData({ ...quarantineData, reason: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-center space-x-2"
              >
                <Lock className="w-4 h-4" />
                <span>{isLoading ? 'Publishing Blockchain Quarantine...' : 'Sign & Enforce Immediate Quarantine'}</span>
              </button>
            </form>
          )}

          {activeTab === 'tamper' && (
            <form onSubmit={handleReportTamper} className="max-w-xl mx-auto space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start space-x-3 text-amber-300 text-xs">
                <FileWarning className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  Reporting broken holographic seal or physical tampering records an immutable <code className="text-amber-200">TamperReport</code> on-chain, automatically flags the product as compromised, and notifies regulatory oversight bodies.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Batch ID</label>
                <input
                  required
                  placeholder="e.g. PARA-2026-001"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono outline-none focus:ring-2 focus:ring-amber-500"
                  value={tamperData.drugId}
                  onChange={e => setTamperData({ ...tamperData, drugId: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Physical Hologram / Seal Serial Number</label>
                <input
                  required
                  placeholder="e.g. SEAL-MFR-98214"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono outline-none focus:ring-2 focus:ring-amber-500"
                  value={tamperData.sealId}
                  onChange={e => setTamperData({ ...tamperData, sealId: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Inspection Observations</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Describe observed physical damage, torn holographic sticker, or mismatched QR code..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  value={tamperData.description}
                  onChange={e => setTamperData({ ...tamperData, description: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center space-x-2"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{isLoading ? 'Publishing Tamper Report...' : 'Broadcast Tamper Event On-Chain'}</span>
              </button>
            </form>
          )}

          {activeTab === 'release' && isRegulator && (
            <form onSubmit={handleReleaseQuarantine} className="max-w-xl mx-auto space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start space-x-3 text-emerald-300 text-xs">
                <Unlock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  Regulator Authority Clearance: Calling <code className="text-emerald-200">releaseQuarantine()</code> restores a quarantined batch back to <code className="text-emerald-200">AVAILABLE</code> status once laboratory audits clear it. <em>Note: Recalled batches cannot be released.</em>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Batch ID</label>
                <input
                  required
                  placeholder="e.g. PARA-2026-001"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                  value={releaseData.drugId}
                  onChange={e => setReleaseData({ ...releaseData, drugId: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Clearance Certificate / Note</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Reference official inspection docket, lab report hash, or compliance certificate..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  value={releaseData.note}
                  onChange={e => setReleaseData({ ...releaseData, note: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isLoading ? 'Executing Release Decree...' : 'Issue Regulatory Clearance & Unlock Batch'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/70 flex justify-between items-center text-xs text-slate-400">
          <div className="flex items-center space-x-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
            <span>Sentinel Telemetry: ACTIVE NODE</span>
          </div>
          <button
            onClick={fetchRadar}
            className="flex items-center space-x-1.5 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Radar</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SentinelDefenseShield;
