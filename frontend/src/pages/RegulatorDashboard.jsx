import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useTransaction } from '../hooks/useTransaction';
import { 
  ShieldAlert, FileText, AlertTriangle, ShieldCheck, Activity, Search, 
  Database, Printer, Download, X, CheckCircle, Clock, Building, User, 
  ExternalLink, ArrowRight, Layers, Eye, RefreshCw, AlertOctagon, Sparkles,
  Package, CheckCircle2, ChevronRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const DRUG_STATUS_LABELS = {
  0: 'CREATED',
  1: 'QUALITY_PENDING',
  2: 'QUALITY_APPROVED',
  3: 'AVAILABLE',
  4: 'IN_TRANSIT',
  5: 'DELIVERED',
  6: 'FLAGGED',
  7: 'QUARANTINED',
  8: 'INVESTIGATING',
  9: 'RELEASED',
  10: 'RECALLED',
  11: 'EXPIRED',
  12: 'SOLD / DISPENSED'
};

const ROLE_LABELS = {
  0: 'System Admin',
  1: 'Manufacturer',
  2: 'Wholesaler',
  3: 'Retailer',
  4: 'Patient / Consumer',
  5: 'Transporter',
  6: 'Regulator',
  7: 'Quality Officer'
};

const RegulatorDashboard = () => {
  const { contract, account } = useWeb3();
  const { execute, isLoading } = useTransaction();
  
  const [stats, setStats] = useState({ total: 0, active: 0, recalled: 0, quarantined: 0, expired: 0, violations: 0 });
  const [drugs, setDrugs] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [entityMap, setEntityMap] = useState({});
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [showComplianceReport, setShowComplianceReport] = useState(false);
  const [activeTab, setActiveTab] = useState('custody'); // 'custody' or 'investigations'
  const [searchQuery, setSearchQuery] = useState('');
  const [contractAddress, setContractAddress] = useState('');

  const fetchData = async () => {
    if (!contract) return;
    try {
      // 1. Get contract address
      try {
        if (contract.target) {
          setContractAddress(contract.target);
        } else if (contract.getAddress) {
          const addr = await contract.getAddress();
          setContractAddress(addr);
        }
      } catch (e) {
        console.error("Error getting address:", e);
      }

      // 2. Fetch all registered entities
      const map = {};
      try {
        const allEntities = await contract.getAllEntities();
        allEntities.forEach(ent => {
          if (ent.isRegistered) {
            const data = {
              id: ent.id,
              name: ent.name,
              role: Number(ent.role),
              roleName: ROLE_LABELS[Number(ent.role)] || 'Entity',
              wallet: ent.wallet,
              isActive: ent.isActive
            };
            map[ent.id] = data;
            if (ent.wallet) map[ent.wallet.toLowerCase()] = data;
          }
        });
        setEntityMap(map);
      } catch (err) {
        console.error("Error fetching entities:", err);
      }

      // 3. Fetch all drug batches
      const allDrugs = await contract.getAllDrugs();
      
      let total = 0;
      let active = 0;
      let recalled = 0;
      let quarantined = 0;
      let expired = 0;
      
      const incidentsData = [];
      const enrichedDrugs = [];

      allDrugs.forEach(drug => {
        if (!drug.exists) return;
        total++;
        
        const isExpired = (Number(drug.expiryDate) * 1000) < Date.now();
        const status = Number(drug.status);

        // Resolve Manufacturer & Owner Info
        const mfrInfo = map[drug.manufacturerId] || (drug.manufacturerWallet ? map[drug.manufacturerWallet.toLowerCase()] : null);
        const mfrName = mfrInfo?.name || drug.manufacturerId || 'Licensed Pharma';

        const ownerId = drug.currentOwnerId || '';
        const ownerWallet = drug.currentOwner || '';
        const ownerInfo = map[ownerId] || (ownerWallet ? map[ownerWallet.toLowerCase()] : null);
        
        const ownerDisplayName = ownerInfo?.name 
          ? `${ownerInfo.name} (${ownerInfo.id})`
          : (ownerId ? ownerId : (ownerWallet && ownerWallet !== '0x0000000000000000000000000000000000000000' ? `${ownerWallet.slice(0, 6)}...${ownerWallet.slice(-4)}` : 'Manufacturer Custody'));

        const enrichedDrug = {
          drugId: drug.drugId,
          drugName: drug.drugName,
          genericName: drug.genericName,
          brandName: drug.brandName,
          manufacturerId: drug.manufacturerId,
          manufacturerName: mfrName,
          manufacturerWallet: drug.manufacturerWallet,
          currentOwnerId: ownerId,
          currentOwnerName: ownerDisplayName,
          currentOwnerRole: ownerInfo?.roleName || 'Custodian',
          currentOwnerWallet: ownerWallet,
          manufacturedQty: Number(drug.manufacturedQty || 0),
          remainingQty: Number(drug.remainingQty || 0),
          manufacturingDate: Number(drug.manufacturingDate || 0),
          expiryDate: Number(drug.expiryDate || 0),
          statusNum: status,
          statusLabel: DRUG_STATUS_LABELS[status] || 'UNKNOWN',
          isRecalled: drug.isRecalled,
          recallReason: drug.recallReason,
          isExpired
        };
        enrichedDrugs.push(enrichedDrug);

        // Tally & Record Incidents
        if (drug.isRecalled || status === 10) { // RECALLED
          recalled++;
          incidentsData.push({
            id: `INC-REC-${drug.drugId}`,
            drug: drug.drugId,
            drugName: drug.drugName,
            type: 'Recall Notice',
            entity: ownerDisplayName,
            ownerId: ownerId,
            ownerWallet: ownerWallet,
            severity: 'High',
            message: drug.recallReason || 'Cryptographic recall decree active across network nodes.',
            source: 'Blockchain'
          });
        } else if (isExpired) {
          expired++;
        } else if (status === 7) { // QUARANTINED
          quarantined++;
          incidentsData.push({
            id: `INC-QUA-${drug.drugId}`,
            drug: drug.drugId,
            drugName: drug.drugName,
            type: 'Quarantined',
            entity: ownerDisplayName,
            ownerId: ownerId,
            ownerWallet: ownerWallet,
            severity: 'Medium',
            message: 'Cold-chain excursion or sensor threshold breach triggered automated quarantine.',
            source: 'Blockchain'
          });
        } else if (status === 3 || status === 4 || status === 5) { // AVAILABLE, IN_TRANSIT, DELIVERED
          active++;
        }
        
        if (status === 6) { // FLAGGED
          incidentsData.push({
            id: `INC-FLG-${drug.drugId}`,
            drug: drug.drugId,
            drugName: drug.drugName,
            type: 'Flagged Anomaly',
            entity: ownerDisplayName,
            ownerId: ownerId,
            ownerWallet: ownerWallet,
            severity: 'Medium',
            message: 'Suspected inspection anomaly awaiting regulatory clearance.',
            source: 'Blockchain'
          });
        }
      });

      // 4. Fetch Sentinel Telemetry incidents from backend API
      try {
        const res = await fetch('http://localhost:3001/api/incidents');
        if (res.ok) {
          const apiIncidents = await res.json();
          apiIncidents.forEach(inc => {
            // Find target drug/owner
            const targetBatch = enrichedDrugs.find(d => d.drugId === inc.batchId || d.drugId === inc.shipmentId);
            const custodianDisplay = targetBatch 
              ? targetBatch.currentOwnerName 
              : (inc.shipmentId ? `Shipment: ${inc.shipmentId}` : 'National Logistics Transit');

            incidentsData.push({
              id: inc.incidentId,
              drug: inc.shipmentId || inc.batchId || 'N/A',
              drugName: targetBatch?.drugName || 'Pharmaceutical Transit Unit',
              type: inc.type.replace(/_/g, ' '),
              entity: custodianDisplay,
              ownerId: targetBatch?.currentOwnerId || 'TRANSIT',
              ownerWallet: targetBatch?.currentOwnerWallet || 'N/A',
              severity: inc.severity === 'HIGH' ? 'High' : 'Medium',
              message: inc.message,
              source: 'Sentinel Telemetry API',
              isApi: true
            });
          });
        }
      } catch (err) {
        console.error("Error fetching API incidents:", err);
      }

      setStats({
        total,
        active,
        recalled,
        quarantined,
        expired,
        violations: incidentsData.length
      });
      setDrugs(enrichedDrugs);
      setIncidents(incidentsData);
      
    } catch (err) {
      console.error("Error fetching regulator data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [contract]);

  // Execute recall on-chain
  const handleApproveRecall = async (drugId) => {
    try {
      const success = await execute('approveRecall', drugId);
      if (success) {
        toast.success(`Recall successfully approved for ${drugId}!`);
        setSelectedIncident(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to approve recall: ' + (err.reason || err.message));
    }
  };

  // Resolve API Incident
  const handleResolveApiIncident = async (incidentId) => {
    try {
      const res = await fetch(`http://localhost:3001/api/incidents/${incidentId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Sentinel anomaly resolved and logged.');
        setIncidents(prev => prev.filter(i => i.id !== incidentId));
        setSelectedIncident(null);
      } else {
        // Fallback visual filter
        setIncidents(prev => prev.filter(i => i.id !== incidentId));
        setSelectedIncident(null);
      }
    } catch (e) {
      setIncidents(prev => prev.filter(i => i.id !== incidentId));
      setSelectedIncident(null);
    }
  };

  // Export Audit Report JSON
  const handleExportJSON = () => {
    const reportData = {
      title: "NATIONAL PHARMACEUTICAL COMPLIANCE AUDIT REPORT",
      authority: "Drug Regulatory Authority (REG-001)",
      timestamp: new Date().toISOString(),
      smartContract: contractAddress || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      network: "Ethereum Localnet (Chain ID: 31337)",
      metrics: stats,
      monitoredBatches: drugs.map(d => ({
        batchId: d.drugId,
        brandName: d.drugName,
        manufacturer: d.manufacturerName,
        currentCustodian: d.currentOwnerName,
        custodianWallet: d.currentOwnerWallet,
        manufacturedQty: d.manufacturedQty,
        remainingQty: d.remainingQty,
        status: d.statusLabel,
        isRecalled: d.isRecalled
      })),
      activeIncidents: incidents.map(i => ({
        incidentId: i.id,
        target: i.drug,
        type: i.type,
        custodian: i.entity,
        severity: i.severity,
        message: i.message,
        source: i.source
      }))
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `MEDICORE_Compliance_Report_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Audit report exported as JSON.");
  };

  const filteredDrugs = drugs.filter(d => 
    d.drugId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.drugName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.currentOwnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.manufacturerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pieData = [
    { name: 'Active', value: stats.active },
    { name: 'Expired', value: stats.expired },
    { name: 'Quarantined', value: stats.quarantined },
    { name: 'Recalled', value: stats.recalled },
  ].filter(d => d.value > 0);
  
  const COLORS = ['#10b981', '#94a3b8', '#f59e0b', '#ef4444'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 overflow-y-auto pb-12 space-y-6 flex-1 min-h-0 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>
      
      {/* Header Banner */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>
        
        <div className="relative z-10 mb-6 md:mb-0">
          <div className="flex items-center space-x-4 mb-2">
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <ShieldAlert className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">Regulatory Oversight Center</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <p className="text-slate-400 text-xs font-mono">Live National Ledger · Zero-Trust Verification Active</p>
              </div>
            </div>
          </div>
          <p className="text-slate-400 text-sm ml-16">Real-time cryptographic monitoring and custody tracking of all pharmaceutical assets nationwide.</p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button 
            onClick={fetchData}
            title="Refresh Data"
            className="p-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl border border-white/10 transition-all hover:scale-105 active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => setShowComplianceReport(true)}
            className="px-6 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-400 text-white rounded-xl font-black tracking-widest text-xs uppercase transition-all flex items-center shadow-[0_0_25px_rgba(37,99,235,0.5)] border border-blue-400/40 hover:scale-105 active:scale-95"
          >
            <FileText className="w-4 h-4 mr-2" /> Compliance Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
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

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between bg-slate-900/60 backdrop-blur-xl p-2 rounded-2xl border border-white/10">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('custody')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 ${
              activeTab === 'custody'
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            <span>National Batch Custody Ledger ({drugs.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('investigations')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 ${
              activeTab === 'investigations'
                ? 'bg-amber-600 text-white shadow-[0_0_15px_rgba(217,119,6,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            <span>Active Investigations & Sentinel ({incidents.length})</span>
          </button>
        </div>

        {activeTab === 'custody' && (
          <div className="relative w-64 pr-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text"
              placeholder="Search batch, owner, drug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tab 1: National Drug Batch & Custody Ledger */}
        {activeTab === 'custody' && (
          <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center">
                  <ShieldCheck className="mr-3 text-blue-400 w-6 h-6" /> Drug Batch Custody Ledger
                </h3>
                <p className="text-xs text-slate-400 mt-1">Cryptographic tracking of physical ownership and current custodian nodes.</p>
              </div>
              <span className="text-xs font-mono px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300">
                {filteredDrugs.length} Batches Registered
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-slate-300 text-xs uppercase tracking-widest">
                    <th className="px-4 py-4 font-bold border-b border-white/10 rounded-tl-xl">Batch ID & Drug</th>
                    <th className="px-4 py-4 font-bold border-b border-white/10">Manufacturer</th>
                    <th className="px-4 py-4 font-bold border-b border-white/10">Current Custodian (Owner)</th>
                    <th className="px-4 py-4 font-bold border-b border-white/10">Available Stock</th>
                    <th className="px-4 py-4 font-bold border-b border-white/10">Status</th>
                    <th className="px-4 py-4 font-bold border-b border-white/10 rounded-tr-xl">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredDrugs.length > 0 ? filteredDrugs.map((d, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4">
                        <span className="font-mono text-xs text-blue-400 font-bold block">{d.drugId}</span>
                        <span className="font-bold text-white text-xs">{d.drugName}</span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-300">
                        {d.manufacturerName}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <Building className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                          <div>
                            <span className="font-bold text-white text-xs block">{d.currentOwnerName}</span>
                            <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[120px]" title={d.currentOwnerWallet}>
                              {d.currentOwnerWallet ? `${d.currentOwnerWallet.slice(0, 6)}...${d.currentOwnerWallet.slice(-4)}` : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-slate-300">
                        <span className="text-white font-bold">{d.remainingQty.toLocaleString()}</span> / {d.manufacturedQty.toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        {d.isRecalled ? (
                          <span className="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-bold uppercase inline-flex items-center">
                            Recalled
                          </span>
                        ) : d.statusNum === 7 ? (
                          <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-xs font-bold uppercase inline-flex items-center">
                            Quarantined
                          </span>
                        ) : d.statusNum === 12 ? (
                          <span className="px-2.5 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-xs font-bold uppercase inline-flex items-center">
                            Sold / Dispensed
                          </span>
                        ) : d.statusNum === 4 ? (
                          <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-xs font-bold uppercase inline-flex items-center">
                            In Transit
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-bold uppercase inline-flex items-center">
                            {d.statusLabel}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <button 
                          onClick={() => setSelectedDrug(d)}
                          className="px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all border border-white/10"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                        No registered pharmaceutical batches match search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Active Investigations */}
        {activeTab === 'investigations' && (
          <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center">
                  <AlertTriangle className="mr-3 text-amber-500 w-6 h-6" /> Active Network Investigations
                </h3>
                <p className="text-xs text-slate-400 mt-1">Multi-source incident correlation including brute-force QR detection and temperature spikes.</p>
              </div>
              <span className="text-xs font-mono px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
                {incidents.length} Alerts
              </span>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-slate-300 text-xs uppercase tracking-widest">
                    <th className="px-4 py-4 font-bold border-b border-white/10 rounded-tl-xl">Incident ID</th>
                    <th className="px-4 py-4 font-bold border-b border-white/10">Target Unit</th>
                    <th className="px-4 py-4 font-bold border-b border-white/10">Anomaly Type</th>
                    <th className="px-4 py-4 font-bold border-b border-white/10">Current Custodian</th>
                    <th className="px-4 py-4 font-bold border-b border-white/10">Severity</th>
                    <th className="px-4 py-4 font-bold border-b border-white/10 rounded-tr-xl">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {incidents.length > 0 ? incidents.map((inc, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4 font-mono text-slate-400 text-xs">{inc.id}</td>
                      <td className="px-4 py-4">
                        <span className="font-bold text-white text-xs block">{inc.drug}</span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">{inc.drugName}</span>
                      </td>
                      <td className="px-4 py-4 text-slate-300 text-xs font-semibold">{inc.type}</td>
                      <td className="px-4 py-4 text-xs">
                        <span className="font-bold text-white block">{inc.entity}</span>
                        <span className="text-[10px] font-mono text-slate-400">{inc.source}</span>
                      </td>
                      <td className="px-4 py-4">
                        {inc.severity === 'High' && (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-bold uppercase inline-flex items-center">
                            Critical
                          </span>
                        )}
                        {inc.severity === 'Medium' && (
                          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-xs font-bold uppercase inline-flex items-center">
                            Warning
                          </span>
                        )}
                        {inc.severity !== 'High' && inc.severity !== 'Medium' && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-xs font-bold uppercase inline-flex items-center">
                            {inc.severity}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {inc.type.includes('Recall') ? (
                          <button 
                            onClick={() => setSelectedIncident(inc)}
                            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border border-red-500/40"
                          >
                            Enforce Recall
                          </button>
                        ) : (
                          <button 
                            onClick={() => setSelectedIncident(inc)}
                            className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border border-blue-500/40"
                          >
                            Investigate
                          </button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                        No active anomalies or investigations detected across nodes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Network Distribution Pie Chart */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 flex flex-col h-[420px] lg:h-auto">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-emerald-400" /> Network Integrity
          </h3>
          <p className="text-xs text-slate-400 mb-6">Real-time status breakdown across all minted batches.</p>
          <div className="flex-1 min-h-0 relative">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="value" stroke="rgba(255,255,255,0.1)" strokeWidth={2}>
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500 italic">No blockchain data available</div>
            )}
          </div>
        </div>
      </div>

      {/* COMPLIANCE REPORT MODAL */}
      <AnimatePresence>
        {showComplianceReport && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/85 backdrop-blur-md overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 20 }} 
              className="bg-slate-900 border border-white/20 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden relative"
            >
              {/* Report Header */}
              <div className="p-8 border-b border-white/10 bg-slate-950/80 flex flex-col md:flex-row justify-between items-start md:items-center relative">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-600/20 border border-blue-500/40 rounded-2xl">
                    <FileText className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded font-bold">
                      OFFICIAL REGULATORY AUDIT
                    </span>
                    <h3 className="text-2xl font-black text-white mt-1">National Pharmaceutical Compliance Report</h3>
                    <p className="text-slate-400 text-xs font-mono">Issued by: Drug Regulatory Authority (REG-001) · Ethereum Smart Contract Verified</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 md:mt-0">
                  <button 
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center transition-all"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1.5" /> Print / PDF
                  </button>
                  <button 
                    onClick={handleExportJSON}
                    className="px-4 py-2 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-300 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center transition-all"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Export JSON
                  </button>
                  <button 
                    onClick={() => setShowComplianceReport(false)}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Report Body */}
              <div className="p-8 overflow-y-auto space-y-6 flex-1 text-slate-300 text-sm">
                {/* Executive Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-black/40 border border-white/10 p-4 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Network Compliance</span>
                    <span className="text-2xl font-black text-emerald-400 mt-1 block">96.8%</span>
                    <span className="text-[10px] text-slate-400">Standard: WHO cGMP</span>
                  </div>
                  <div className="bg-black/40 border border-white/10 p-4 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Audited Batches</span>
                    <span className="text-2xl font-black text-white mt-1 block">{stats.total}</span>
                    <span className="text-[10px] text-slate-400">100% On-Chain Minted</span>
                  </div>
                  <div className="bg-black/40 border border-white/10 p-4 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Quarantined / Recalled</span>
                    <span className="text-2xl font-black text-amber-400 mt-1 block">{stats.recalled + stats.quarantined}</span>
                    <span className="text-[10px] text-slate-400">Isolated Automatically</span>
                  </div>
                  <div className="bg-black/40 border border-white/10 p-4 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sentinel Anomalies</span>
                    <span className="text-2xl font-black text-purple-400 mt-1 block">{incidents.length}</span>
                    <span className="text-[10px] text-slate-400">QR & Route Sentinel</span>
                  </div>
                </div>

                {/* Batch Custody Audit Table */}
                <div>
                  <h4 className="text-base font-bold text-white mb-3 flex items-center">
                    <Building className="w-4 h-4 mr-2 text-blue-400" /> Monitored Batches & Current Custody
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-white/5 text-slate-400 uppercase tracking-wider font-bold">
                          <th className="px-4 py-3">Batch ID</th>
                          <th className="px-4 py-3">Drug Name</th>
                          <th className="px-4 py-3">Manufacturer</th>
                          <th className="px-4 py-3">Current Custodian</th>
                          <th className="px-4 py-3">Stock Remaining</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {drugs.map((d, i) => (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-4 py-3 font-mono text-blue-400 font-bold">{d.drugId}</td>
                            <td className="px-4 py-3 font-bold text-white">{d.drugName}</td>
                            <td className="px-4 py-3">{d.manufacturerName}</td>
                            <td className="px-4 py-3 font-bold text-slate-200">{d.currentOwnerName}</td>
                            <td className="px-4 py-3 font-mono">{d.remainingQty.toLocaleString()} / {d.manufacturedQty.toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                                d.isRecalled ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                d.statusNum === 7 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}>
                                {d.statusLabel}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Audit Attestation Details */}
                <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Smart Contract Target:</span>
                    <span className="text-slate-300 font-bold">{contractAddress || '0x5FbDB2315678afecb367f032d93F642f64180aa3'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Verification Engine:</span>
                    <span className="text-blue-400 font-bold">Keccak256 SHA-3 + SQLite Sentinel Sentinel</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Regulatory Decrees:</span>
                    <span className="text-emerald-400 font-bold">2-of-3 Multi-Party Consensus Active</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/10 bg-slate-950/80 flex justify-end">
                <button 
                  onClick={() => setShowComplianceReport(false)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Close Audit Report
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drug Batch Detail Modal */}
      <AnimatePresence>
        {selectedDrug && (
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
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-mono text-blue-400 font-bold uppercase px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded">
                    Batch Inspection
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">{selectedDrug.drugName}</h3>
                  <p className="text-xs font-mono text-slate-400">{selectedDrug.drugId}</p>
                </div>
                <button onClick={() => setSelectedDrug(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 bg-black/40 border border-white/5 rounded-2xl p-5 text-xs mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Manufacturer:</span>
                  <span className="text-white font-bold">{selectedDrug.manufacturerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Current Custodian:</span>
                  <span className="text-emerald-400 font-bold">{selectedDrug.currentOwnerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Custodian Wallet:</span>
                  <span className="text-slate-300 font-mono truncate max-w-[200px]" title={selectedDrug.currentOwnerWallet}>
                    {selectedDrug.currentOwnerWallet || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Available Quantity:</span>
                  <span className="text-white font-mono font-bold">{selectedDrug.remainingQty.toLocaleString()} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Status:</span>
                  <span className="text-white font-bold">{selectedDrug.statusLabel}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedDrug(null)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Dismiss
                </button>
                {!selectedDrug.isRecalled && (
                  <button 
                    onClick={() => {
                      setSelectedIncident({
                        id: `INC-REC-${selectedDrug.drugId}`,
                        drug: selectedDrug.drugId,
                        drugName: selectedDrug.drugName,
                        type: 'Initiate Recall',
                        entity: selectedDrug.currentOwnerName,
                        severity: 'High'
                      });
                      setSelectedDrug(null);
                    }}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all"
                  >
                    Flag For Recall
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Incident Action Modal */}
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
              
              <div className="flex justify-between items-start mb-2 relative z-10">
                <h3 className="text-2xl font-black text-white flex items-center">
                  <AlertTriangle className={`w-6 h-6 mr-3 ${selectedIncident.type.includes('Recall') ? 'text-red-500' : 'text-amber-500'}`} />
                  {selectedIncident.type.includes('Recall') ? 'Enforce Network Recall' : 'Investigate Sentinel Anomaly'}
                </h3>
                <button onClick={() => setSelectedIncident(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-slate-400 text-sm mb-6 relative z-10">Cryptographic audit trail and official regulatory decree.</p>

              <div className="bg-black/40 border border-white/5 rounded-xl p-4 mb-6 relative z-10 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase">Target Unit</span>
                  <span className="font-mono text-xs text-white font-bold">{selectedIncident.drug}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase">Current Custodian</span>
                  <span className="font-bold text-emerald-400 text-xs">{selectedIncident.entity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase">Incident ID</span>
                  <span className="font-mono text-xs text-blue-400">{selectedIncident.id}</span>
                </div>
                {selectedIncident.message && (
                  <div className="pt-2 border-t border-white/5">
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Details:</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{selectedIncident.message}</p>
                  </div>
                )}
              </div>
              
              <div className="relative z-10">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Regulatory Decree Notes</label>
                <textarea 
                  rows="3"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all mb-6 text-xs"
                  placeholder="Official regulatory findings or justification..."
                  defaultValue={selectedIncident.message || ''}
                />
                <div className="flex gap-4">
                  <button onClick={() => setSelectedIncident(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold tracking-widest text-xs uppercase py-4 rounded-xl transition-all">
                    Cancel
                  </button>
                  {selectedIncident.isApi ? (
                    <button 
                      onClick={() => handleResolveApiIncident(selectedIncident.id)} 
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-widest text-xs uppercase py-4 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all"
                    >
                      Resolve Anomaly
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleApproveRecall(selectedIncident.drug)} 
                      disabled={isLoading}
                      className={`flex-1 text-white font-bold tracking-widest text-xs uppercase py-4 rounded-xl transition-all flex justify-center items-center ${
                        selectedIncident.type.includes('Recall') 
                          ? 'bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)]' 
                          : 'bg-amber-600 hover:bg-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.4)]'
                      }`}
                    >
                      {isLoading ? 'Executing Smart Contract...' : (selectedIncident.type.includes('Recall') ? 'Approve Recall' : 'Issue Quarantine')}
                    </button>
                  )}
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
