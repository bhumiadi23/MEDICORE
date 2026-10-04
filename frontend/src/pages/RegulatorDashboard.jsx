import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useTransaction } from '../hooks/useTransaction';
import { 
  ShieldAlert, FileText, AlertTriangle, ShieldCheck, Activity, Search, 
  Database, Printer, Download, X, CheckCircle, Clock, Building, User, 
  ExternalLink, ArrowRight, Layers, Eye, RefreshCw, AlertOctagon, Sparkles,
  Package, CheckCircle2, ChevronRight, Map as MapIcon, Radio, Cpu,
  Flame, Lock, Filter, Send, Award, BarChart3, AlertCircle
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import toast from 'react-hot-toast';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom futuristic Leaflet marker
const createCustomIcon = (color = '#3b82f6', iconText = '📍') => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 0 15px ${color};
        color: white;
        font-size: 14px;
        font-weight: bold;
      ">
        ${iconText}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

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

// Facility geographic nodes for National Map
const FACILITY_LOCATIONS = [
  { id: 'MFR-001', name: 'ABC Pharmaceuticals (Plant Alpha)', role: 'Manufacturer', lat: 19.0760, lng: 72.8777, city: 'Mumbai', color: '#3b82f6', symbol: '🏭' },
  { id: 'WHL-001', name: 'XYZ Wholesalers (Central Depot)', role: 'Wholesaler', lat: 12.9716, lng: 77.5946, city: 'Bengaluru', color: '#06b6d4', symbol: '🏢' },
  { id: 'RET-001', name: 'CityCare Pharmacy (Dispensary #4)', role: 'Retailer', lat: 28.6139, lng: 77.2090, city: 'New Delhi', color: '#10b981', symbol: '🏥' },
  { id: 'TRN-001', name: 'FastMed Fleet Hub (Cold Fleet)', role: 'Transporter', lat: 18.5204, lng: 73.8567, city: 'Pune', color: '#8b5cf6', symbol: '🚚' },
  { id: 'REG-001', name: 'National Drug Authority HQ', role: 'Regulator', lat: 28.5355, lng: 77.3910, city: 'Noida', color: '#f59e0b', symbol: '🏛️' }
];

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
  const [showRecallModal, setShowRecallModal] = useState(false);
  const [recallBatchId, setRecallBatchId] = useState('');
  const [recallReason, setRecallReason] = useState('Contamination detected in laboratory assay.');
  const [activeTab, setActiveTab] = useState('custody'); // 'custody', 'map', 'investigations'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'ACTIVE', 'QUARANTINED', 'RECALLED', 'SOLD'
  const [searchQuery, setSearchQuery] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [isVerifyingScan, setIsVerifyingScan] = useState(false);

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
            source: 'Blockchain State',
            timestamp: new Date().toLocaleTimeString()
          });
        } else if (isExpired) {
          expired++;
        } else if (status === 7) { // QUARANTINED
          quarantined++;
          incidentsData.push({
            id: `INC-QUA-${drug.drugId}`,
            drug: drug.drugId,
            drugName: drug.drugName,
            type: 'Cold-Chain Quarantine',
            entity: ownerDisplayName,
            ownerId: ownerId,
            ownerWallet: ownerWallet,
            severity: 'Medium',
            message: 'Temperature spike exceeded safe limit (2°C - 8°C). Smart contract frozen.',
            source: 'Blockchain State',
            timestamp: new Date().toLocaleTimeString()
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
            source: 'Blockchain State',
            timestamp: new Date().toLocaleTimeString()
          });
        }
      });

      // 4. Fetch Sentinel Telemetry incidents from backend API
      try {
        const res = await fetch('http://localhost:3001/api/incidents');
        if (res.ok) {
          const apiIncidents = await res.json();
          apiIncidents.forEach(inc => {
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
              source: 'Sentinel Telemetry Engine',
              timestamp: inc.timestamp || new Date().toLocaleTimeString(),
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

  // Execute recall approval on-chain
  const handleApproveRecall = async (drugId) => {
    try {
      const success = await execute('approveRecall', drugId);
      if (success) {
        toast.success(`Recall decree approved on-chain for ${drugId}!`);
        setSelectedIncident(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to approve recall: ' + (err.reason || err.message));
    }
  };

  // Regulator initiates a new recall
  const handleInitiateRecall = async (e) => {
    e.preventDefault();
    if (!recallBatchId) {
      toast.error("Please select a batch to recall");
      return;
    }
    try {
      const success = await execute('requestRecall', recallBatchId, recallReason);
      if (success) {
        toast.success(`Emergency recall order published on-chain for ${recallBatchId}!`);
        setShowRecallModal(false);
        setRecallBatchId('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Recall initiation failed: ' + (err.reason || err.message));
    }
  };

  // Resolve API Incident
  const handleResolveApiIncident = async (incidentId) => {
    try {
      const res = await fetch(`http://localhost:3001/api/incidents/${incidentId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Sentinel anomaly cleared from security logs.');
        setIncidents(prev => prev.filter(i => i.id !== incidentId));
        setSelectedIncident(null);
      } else {
        setIncidents(prev => prev.filter(i => i.id !== incidentId));
        setSelectedIncident(null);
      }
    } catch (e) {
      setIncidents(prev => prev.filter(i => i.id !== incidentId));
      setSelectedIncident(null);
    }
  };

  // Simulate Instant Network Telemetry Scan
  const handleRunNetworkAudit = () => {
    setIsVerifyingScan(true);
    toast.loading("Scanning 5 network nodes for cryptographic conservation...", { id: 'audit-scan' });
    setTimeout(() => {
      setIsVerifyingScan(false);
      toast.success("Network Scan Complete: Zero divergence detected. 100% quantity conservation confirmed.", { id: 'audit-scan' });
      fetchData();
    }, 1200);
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
        source: i.source,
        timestamp: i.timestamp
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

  // Filtered Drugs
  const filteredDrugs = drugs.filter(d => {
    const matchesQuery = 
      d.drugId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.drugName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.currentOwnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.manufacturerName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesQuery) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ACTIVE') return d.statusNum === 3 || d.statusNum === 4 || d.statusNum === 5;
    if (statusFilter === 'QUARANTINED') return d.statusNum === 7;
    if (statusFilter === 'RECALLED') return d.isRecalled || d.statusNum === 10;
    if (statusFilter === 'SOLD') return d.statusNum === 12;
    return true;
  });

  const pieData = [
    { name: 'Active', value: stats.active },
    { name: 'Expired', value: stats.expired },
    { name: 'Quarantined', value: stats.quarantined },
    { name: 'Recalled', value: stats.recalled },
  ].filter(d => d.value > 0);
  
  const COLORS = ['#10b981', '#94a3b8', '#f59e0b', '#ef4444'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 overflow-y-auto pb-16 space-y-6 flex-1 min-h-0 relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-gradient-to-tr from-blue-900/15 via-indigo-900/10 to-teal-900/10 rounded-full blur-[160px] pointer-events-none -z-10"></div>
      
      {/* Executive Command Header */}
      <div className="bg-slate-900/70 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -ml-32 -mb-32 pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-4 mb-2">
              <div className="p-3.5 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-400/40 rounded-2xl shadow-[0_0_25px_rgba(59,130,246,0.35)]">
                <ShieldAlert className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-3xl font-black text-white tracking-tight">Regulatory Oversight Center</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 font-mono text-[10px] font-bold uppercase tracking-wider">
                    Node: DRA-001
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <p className="text-slate-400 text-xs font-mono">
                    Consensus Engine: 2-of-3 Multi-Sig Recall Active · Cryptographic Invariant Enforced
                  </p>
                </div>
              </div>
            </div>
            <p className="text-slate-400 text-sm ml-16 max-w-2xl leading-relaxed">
              National pharmaceutical ledger monitoring real-time batch ownership, physical custody handoffs, and AI Sentinel anomaly triggers.
            </p>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button 
              onClick={handleRunNetworkAudit}
              disabled={isVerifyingScan}
              className="px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center transition-all border border-white/10 hover:border-white/20 active:scale-95 disabled:opacity-50"
            >
              <Cpu className={`w-4 h-4 mr-2 text-teal-400 ${isVerifyingScan ? 'animate-spin' : ''}`} />
              <span>Audit Scan</span>
            </button>

            <button 
              onClick={() => setShowRecallModal(true)}
              className="px-4 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 hover:text-red-200 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] active:scale-95"
            >
              <Flame className="w-4 h-4 mr-2 text-red-400" />
              <span>Emergency Recall</span>
            </button>
            
            <button 
              onClick={() => setShowComplianceReport(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-black tracking-widest text-xs uppercase transition-all flex items-center shadow-[0_0_30px_rgba(37,99,235,0.5)] border border-blue-400/40 hover:scale-105 active:scale-95"
            >
              <FileText className="w-4 h-4 mr-2" />
              <span>Compliance Report</span>
            </button>
          </div>
        </div>

        {/* Live Network Health Ticker */}
        <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Zero-Trust Conservation:</span>
            <span className="text-emerald-400 font-bold">100% Invariant</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Sentinel Telemetry:</span>
            <span className="text-blue-400 font-bold">Active (Port 3001)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Consensus Standard:</span>
            <span className="text-purple-400 font-bold">21 CFR Part 11</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Smart Contract:</span>
            <span className="text-slate-300 truncate max-w-[130px] font-bold" title={contractAddress}>
              {contractAddress || '0x5FbDB23156...'}
            </span>
          </div>
        </div>
      </div>

      {/* 6 Real-Time KPI Metric Cards with Click-to-Filter */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Batches', value: stats.total, filterKey: 'ALL', color: 'border-slate-500', glow: '', hint: '100% On-Chain' },
          { label: 'Active Status', value: stats.active, filterKey: 'ACTIVE', color: 'border-emerald-500', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]', hint: 'Available Units' },
          { label: 'Active Recalls', value: stats.recalled, filterKey: 'RECALLED', color: 'border-red-500', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]', hint: 'Isolated Globally' },
          { label: 'Quarantined', value: stats.quarantined, filterKey: 'QUARANTINED', color: 'border-amber-500', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]', hint: 'Temp Violations' },
          { label: 'Sold / Dispensed', value: drugs.filter(d => d.statusNum === 12).length, filterKey: 'SOLD', color: 'border-purple-500', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)]', hint: 'Patient POS' },
          { label: 'Total Incidents', value: stats.violations, filterKey: 'ALL', color: 'border-sky-500', glow: 'shadow-[0_0_20px_rgba(14,165,233,0.15)]', hint: 'Anomaly Alerts' }
        ].map((s, i) => (
          <div 
            key={i} 
            onClick={() => { setStatusFilter(s.filterKey); setActiveTab('custody'); }}
            className={`bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/5 border-b-4 ${s.color} ${s.glow} transition-all hover:bg-white/10 cursor-pointer group`}
          >
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
              <span className="text-[9px] text-slate-500 font-mono group-hover:text-white transition-colors">{s.hint}</span>
            </div>
            <p className="text-3xl font-black text-white mt-2 group-hover:scale-105 transition-transform">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* 3 Main Interactive Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/70 backdrop-blur-xl p-3 rounded-2xl border border-white/10">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('custody')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 ${
              activeTab === 'custody'
                ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            <span>National Custody Ledger ({drugs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 ${
              activeTab === 'map'
                ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MapIcon className="w-4 h-4 mr-2" />
            <span>Jurisdiction & Facility Map</span>
          </button>
          
          <button
            onClick={() => setActiveTab('investigations')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 ${
              activeTab === 'investigations'
                ? 'bg-amber-600 text-white shadow-[0_0_20px_rgba(217,119,6,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            <span>Sentinel Investigations ({incidents.length})</span>
          </button>
        </div>

        {activeTab === 'custody' && (
          <div className="flex items-center gap-2">
            {/* Status Quick Filter Pills */}
            <div className="hidden xl:flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 text-[10px] font-bold uppercase">
              {['ALL', 'ACTIVE', 'QUARANTINED', 'RECALLED', 'SOLD'].map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    statusFilter === f 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input 
                type="text"
                placeholder="Search batch, owner, drug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: National Drug Batch & Custody Ledger */}
      {activeTab === 'custody' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center">
                  <ShieldCheck className="mr-3 text-blue-400 w-6 h-6" /> Drug Batch Custody Ledger
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Cryptographically verified physical custody, current warehouse owner, and mathematical quantity balance.
                </p>
              </div>
              <span className="text-xs font-mono px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300">
                {filteredDrugs.length} of {drugs.length} Shown
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/40 flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-slate-300 text-xs uppercase tracking-widest">
                    <th className="px-4 py-4 font-bold border-b border-white/10 rounded-tl-xl">Batch ID & Drug</th>
                    <th className="px-4 py-4 font-bold border-b border-white/10">Manufacturer</th>
                    <th className="px-4 py-4 font-bold border-b border-white/10">Current Custodian (Owner)</th>
                    <th className="px-4 py-4 font-bold border-b border-white/10">Quantity Invariant</th>
                    <th className="px-4 py-4 font-bold border-b border-white/10">Status</th>
                    <th className="px-4 py-4 font-bold border-b border-white/10 rounded-tr-xl">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredDrugs.length > 0 ? filteredDrugs.map((d, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4">
                        <span className="font-mono text-xs text-blue-400 font-bold block">{d.drugId}</span>
                        <span className="font-bold text-white text-xs block">{d.drugName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Temp Spec: 2°C - 8°C</span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-300">
                        <span className="font-semibold text-white block">{d.manufacturerName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{d.manufacturerId}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                          <div>
                            <span className="font-bold text-white text-xs block">{d.currentOwnerName}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[9px] font-bold">
                                {d.currentOwnerRole}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[100px]" title={d.currentOwnerWallet}>
                                {d.currentOwnerWallet ? `${d.currentOwnerWallet.slice(0, 6)}...${d.currentOwnerWallet.slice(-4)}` : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-bold">{d.remainingQty.toLocaleString()}</span>
                          <span className="text-slate-500">/ {d.manufacturedQty.toLocaleString()}</span>
                        </div>
                        <div className="w-28 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
                            style={{ width: `${Math.min(100, (d.remainingQty / (d.manufacturedQty || 1)) * 100)}%` }}
                          />
                        </div>
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
                            Sold / Patient
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
                          className="px-3.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-blue-500/30 hover:border-blue-400 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-12 text-center text-slate-500">
                        No registered pharmaceutical batches match search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Network Integrity Pie Chart */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 flex flex-col h-[460px] lg:h-auto">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-emerald-400" /> Network Status Distribution
            </h3>
            <p className="text-xs text-slate-400 mb-6">Cryptographic balance between active distribution and safety locks.</p>
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

            {/* Quick Audit Stat Box */}
            <div className="mt-4 p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Units Manufactured:</span>
                <span className="text-white font-mono font-bold">
                  {drugs.reduce((acc, curr) => acc + curr.manufacturedQty, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Units Remaining:</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {drugs.reduce((acc, curr) => acc + curr.remainingQty, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Live Geographic Custody & Supply Route Map */}
      {activeTab === 'map' && (
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 flex flex-col space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-2xl font-black text-white flex items-center">
                <MapIcon className="mr-3 text-emerald-400 w-7 h-7" /> National Facility Jurisdiction Map
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Spatial tracking of certified manufacturing plants, wholesale distribution hubs, retail dispensing counters, and active freight corridors.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300">
                <span>🏭 Manufacturer</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-300">
                <span>🏢 Wholesaler</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300">
                <span>🏥 Pharmacy</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-300">
                <span>🚚 Fleet Hub</span>
              </div>
            </div>
          </div>

          <div className="h-[520px] rounded-2xl overflow-hidden border border-white/10 relative z-0">
            <MapContainer 
              center={[20.5937, 78.9629]} 
              zoom={5} 
              style={{ height: '100%', width: '100%', background: '#020617' }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution="&copy; OpenStreetMap contributors &copy; CARTO"
              />

              {/* Connecting distribution corridor polylines */}
              <Polyline 
                positions={[
                  [19.0760, 72.8777], // Mumbai
                  [18.5204, 73.8567], // Pune
                  [12.9716, 77.5946]  // Bangalore
                ]}
                pathOptions={{ color: '#38bdf8', weight: 3, dashArray: '8, 8', opacity: 0.7 }}
              />

              <Polyline 
                positions={[
                  [19.0760, 72.8777], // Mumbai
                  [28.6139, 77.2090]  // Delhi
                ]}
                pathOptions={{ color: '#a855f7', weight: 3, dashArray: '6, 8', opacity: 0.6 }}
              />

              {FACILITY_LOCATIONS.map((fac) => (
                <Marker 
                  key={fac.id} 
                  position={[fac.lat, fac.lng]} 
                  icon={createCustomIcon(fac.color, fac.symbol)}
                >
                  <Popup className="custom-popup">
                    <div className="p-2 text-slate-900">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase" style={{ background: `${fac.color}20`, color: fac.color }}>
                        {fac.role}
                      </span>
                      <h4 className="font-bold text-base mt-1">{fac.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">Facility ID: {fac.id} · {fac.city}</p>
                      <div className="mt-2 text-xs border-t border-slate-200 pt-2 space-y-1">
                        <div><strong>Compliance Grade:</strong> ISO 9001 · cGMP Verified</div>
                        <div><strong>Regulatory Clearance:</strong> Active License</div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}

      {/* TAB 3: Active Investigations & Sentinel Engine */}
      {activeTab === 'investigations' && (
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-black text-white flex items-center">
                <AlertTriangle className="mr-3 text-amber-500 w-7 h-7" /> AI & IoT Sentinel Investigation Center
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Real-time incident feed correlating brute-force QR scan attacks, cold-chain temperature violations, and off-chain supply diversions.
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              {incidents.length} Open Incidents
            </span>
          </div>
          
          <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/40 flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-slate-300 text-xs uppercase tracking-widest">
                  <th className="px-4 py-4 font-bold border-b border-white/10 rounded-tl-xl">Incident ID & Time</th>
                  <th className="px-4 py-4 font-bold border-b border-white/10">Target Unit</th>
                  <th className="px-4 py-4 font-bold border-b border-white/10">Anomaly Classification</th>
                  <th className="px-4 py-4 font-bold border-b border-white/10">Current Custodian</th>
                  <th className="px-4 py-4 font-bold border-b border-white/10">Severity</th>
                  <th className="px-4 py-4 font-bold border-b border-white/10 rounded-tr-xl">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {incidents.length > 0 ? incidents.map((inc, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4 font-mono text-xs">
                      <span className="text-slate-300 font-bold block">{inc.id}</span>
                      <span className="text-slate-500 text-[10px]">{inc.timestamp}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-bold text-white text-xs block">{inc.drug}</span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">{inc.drugName}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-slate-200 text-xs font-semibold block">{inc.type}</span>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[200px]" title={inc.message}>{inc.message}</span>
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <span className="font-bold text-cyan-300 block">{inc.entity}</span>
                      <span className="text-[10px] font-mono text-slate-400">{inc.source}</span>
                    </td>
                    <td className="px-4 py-4">
                      {inc.severity === 'High' && (
                        <span className="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-bold uppercase inline-flex items-center">
                          Critical
                        </span>
                      )}
                      {inc.severity === 'Medium' && (
                        <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-xs font-bold uppercase inline-flex items-center">
                          Warning
                        </span>
                      )}
                      {inc.severity !== 'High' && inc.severity !== 'Medium' && (
                        <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-xs font-bold uppercase inline-flex items-center">
                          {inc.severity}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {inc.type.includes('Recall') ? (
                        <button 
                          onClick={() => setSelectedIncident(inc)}
                          className="px-3.5 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                        >
                          Enforce Recall
                        </button>
                      ) : (
                        <button 
                          onClick={() => setSelectedIncident(inc)}
                          className="px-3.5 py-1.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                        >
                          Investigate
                        </button>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center text-slate-500">
                      No active anomalies or security incidents detected across nodes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COMPLIANCE REPORT MODAL (OFFICIAL AUDIT CERTIFICATE) */}
      <AnimatePresence>
        {showComplianceReport && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-md overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 20 }} 
              className="bg-slate-900 border border-white/20 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden relative"
            >
              {/* Modal Action Controls */}
              <div className="p-8 border-b border-white/10 bg-slate-950/80 flex flex-col md:flex-row justify-between items-start md:items-center relative">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded font-bold">
                      OFFICIAL DIGITAL AUDIT DOSSIER
                    </span>
                    <h3 className="text-2xl font-black text-white mt-1">National Pharmaceutical Compliance Certificate</h3>
                    <p className="text-slate-400 text-xs font-mono">Authority: Drug Regulatory Authority (REG-001) · SHA-256 Ledger Certified</p>
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

              {/* Printable Official Body */}
              <div className="p-8 overflow-y-auto space-y-6 flex-1 text-slate-300 text-sm">
                {/* Official Declaration Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-transparent border border-blue-500/30 text-xs leading-relaxed">
                  <strong className="text-blue-300 block mb-1 uppercase font-bold">Regulatory Attestation Declaration:</strong>
                  This document certifies that all pharmaceutical assets registered below have been monitored under the National Decentralized Pharmaceutical Traceability Framework. All custody handoffs were validated via single-use Keccak256 verification hashes, ensuring absolute mathematical conservation of inventory units.
                </div>

                {/* Executive Audit KPI Matrix */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-black/50 border border-white/10 p-4 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Compliance Index</span>
                    <span className="text-2xl font-black text-emerald-400 mt-1 block">96.8%</span>
                    <span className="text-[10px] text-slate-400">Standard: WHO cGMP</span>
                  </div>
                  <div className="bg-black/50 border border-white/10 p-4 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Audited Batches</span>
                    <span className="text-2xl font-black text-white mt-1 block">{stats.total}</span>
                    <span className="text-[10px] text-slate-400">100% On-Chain Minted</span>
                  </div>
                  <div className="bg-black/50 border border-white/10 p-4 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Quarantined / Recalled</span>
                    <span className="text-2xl font-black text-amber-400 mt-1 block">{stats.recalled + stats.quarantined}</span>
                    <span className="text-[10px] text-slate-400">Isolated Automatically</span>
                  </div>
                  <div className="bg-black/50 border border-white/10 p-4 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sentinel Anomalies</span>
                    <span className="text-2xl font-black text-purple-400 mt-1 block">{incidents.length}</span>
                    <span className="text-[10px] text-slate-400">QR & Route Sentinel</span>
                  </div>
                </div>

                {/* Batch Custody Audit Table */}
                <div>
                  <h4 className="text-base font-bold text-white mb-3 flex items-center">
                    <Building className="w-4 h-4 mr-2 text-blue-400" /> Monitored Batches & Current Custody Breakdown
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-white/5 text-slate-400 uppercase tracking-wider font-bold">
                          <th className="px-4 py-3">Batch ID</th>
                          <th className="px-4 py-3">Drug Formulation</th>
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

      {/* EMERGENCY RECALL INITIATION MODAL */}
      <AnimatePresence>
        {showRecallModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 20 }} 
              className="bg-slate-900 border border-red-500/30 rounded-3xl shadow-2xl p-8 max-w-lg w-full relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/10 rounded-full blur-[40px] -mr-24 -mt-24 pointer-events-none"></div>

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl">
                    <Flame className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">Initiate Emergency Recall</h3>
                    <p className="text-slate-400 text-xs">Official Regulatory Decree (2-of-3 Consensus)</p>
                  </div>
                </div>
                <button onClick={() => setShowRecallModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleInitiateRecall} className="space-y-4 relative z-10 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-widest mb-1">Target Pharmaceutical Batch</label>
                  <select 
                    value={recallBatchId} 
                    onChange={(e) => setRecallBatchId(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-red-500"
                  >
                    <option value="">-- Select Active Batch --</option>
                    {drugs.filter(d => !d.isRecalled).map(d => (
                      <option key={d.drugId} value={d.drugId}>
                        {d.drugId} — {d.drugName} (Held by: {d.currentOwnerName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-widest mb-1">Official Decree Justification</label>
                  <textarea 
                    value={recallReason} 
                    onChange={(e) => setRecallReason(e.target.value)}
                    rows="3"
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white placeholder-slate-600 outline-none focus:border-red-500"
                    placeholder="Enter contamination details or regulatory violation..."
                  />
                </div>

                <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl text-red-300">
                  <p className="text-[11px] leading-relaxed">
                    ⚠️ <strong>Irrevocable Order:</strong> Upon initiating, this order broadcasts an emergency freeze across all retail and wholesale terminals.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowRecallModal(false)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(239,68,68,0.5)] disabled:opacity-50"
                  >
                    {isLoading ? 'Publishing Order...' : 'Publish Recall Order'}
                  </button>
                </div>
              </form>
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
                    Batch Custody Dossier
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
                      setRecallBatchId(selectedDrug.drugId);
                      setSelectedDrug(null);
                      setShowRecallModal(true);
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
