import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useTransaction } from '../hooks/useTransaction';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Send, Activity, Archive, Store, ShieldAlert, Package, TrendingUp, AlertTriangle, ClipboardCheck, Key, CheckCircle2, Truck } from 'lucide-react';
import { formatDateTime } from '../utils/helpers';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const SHIPMENT_STATUS_LABELS = ['Preparing', 'Dispatched', 'In Transit', 'Arrived', 'Delivered', 'Delayed', 'Quarantined'];

const DRUG_STATUS_LABELS = {
  0: 'CREATED',
  1: 'QUALITY_PENDING',
  2: 'QUALITY_APPROVED',
  3: 'AVAILABLE',
  4: 'IN_TRANSIT',
  5: 'DELIVERED',
  6: 'FLAGGED',
  7: 'QUARANTINED',
  8: 'UNDER_INVESTIGATION',
  9: 'RELEASED',
  10: 'RECALLED',
  11: 'EXPIRED',
  12: 'SOLD'
};

const WholesalerDashboard = () => {
  const { contract, entityInfo, account } = useWeb3();
  const { execute, isLoading, error } = useTransaction();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [drugs, setDrugs] = useState([]);
  const [incomingShipments, setIncomingShipments] = useState([]);
  const [stats, setStats] = useState({ totalReceived: 0, totalSupplied: 0 });
  const [supplyData, setSupplyData] = useState({ drugId: '', retailerId: '', quantity: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, data: null });
  const [verifyModal, setVerifyModal] = useState({ isOpen: false, shipment: null, code: '', error: '' });

  const fetchData = async () => {
    if (!contract || !account) return;
    try {
      let inventory = [];
      try {
        inventory = await contract.getWholesalerInventory(account);
      } catch(e) {}

      // Fallback to registered WHL entity wallet if account is not bound directly
      if (!inventory || inventory.length === 0) {
        try {
          const whl = await contract.getEntity(entityInfo?.id || 'WHL-001');
          if (whl && whl.wallet) {
            inventory = await contract.getWholesalerInventory(whl.wallet);
          }
        } catch(e) {}
      }

      const activeInventory = (inventory || []).filter(i => i.exists && Number(i.availableQty) > 0);
      
      let totRec = 0;
      let totSup = 0;
      (inventory || []).forEach(i => {
        if (i.exists) {
          totRec += Number(i.receivedQty || 0);
          totSup += Number(i.suppliedQty || 0);
        }
      });
      setStats({ totalReceived: totRec, totalSupplied: totSup });

      const enrichedDrugs = await Promise.all(activeInventory.map(async (item) => {
        try {
          const batch = await contract.getDrug(item.drugId);
          const statusNum = Number(batch.status);
          const isRecalled = batch.isRecalled || statusNum === 10;
          const isQuarantined = statusNum === 7;
          const isFlagged = statusNum === 6;
          const isInvestigating = statusNum === 8;
          const isBlocked = isRecalled || isQuarantined || isFlagged || isInvestigating;

          return {
            drugId: item.drugId,
            drugName: item.drugName,
            remainingQty: item.availableQty,
            expiryDate: batch.expiryDate,
            isRecalled,
            isQuarantined,
            isFlagged,
            isInvestigating,
            isBlocked,
            statusNum,
            statusLabel: DRUG_STATUS_LABELS[statusNum] || 'AVAILABLE',
            manufacturerId: batch.manufacturerId
          };
        } catch(e) {
          return {
            drugId: item.drugId,
            drugName: item.drugName,
            remainingQty: item.availableQty,
            expiryDate: 0,
            isRecalled: false,
            isQuarantined: false,
            isFlagged: false,
            isInvestigating: false,
            isBlocked: false,
            statusNum: 3,
            statusLabel: 'AVAILABLE',
            manufacturerId: 'Unknown'
          };
        }
      }));
      setDrugs(enrichedDrugs);

      // Fetch Incoming Shipments
      let shipmentsList = [];
      try {
        if (contract.getAllShipments) {
          const all = await contract.getAllShipments();
          shipmentsList = all.filter(s => s.exists && (s.destinationId === entityInfo?.id || s.destinationId === 'WHL-001'));
        } else if (contract.getShipmentsByReceiver) {
          shipmentsList = await contract.getShipmentsByReceiver(account);
        }
      } catch(e) {
        console.error("Error fetching incoming shipments:", e);
      }

      const enrichedShipments = await Promise.all(shipmentsList.map(async (s) => {
        let drugName = s.drugId;
        try {
          const drugData = await contract.getDrug(s.drugId);
          drugName = drugData.drugName || s.drugId;
        } catch(e) {}
        return {
          id: s.shipmentId,
          drugId: s.drugId,
          drugName,
          quantity: Number(s.quantity || 0),
          sourceId: s.sourceId,
          transporterId: s.transporterId,
          statusNum: Number(s.status),
          status: SHIPMENT_STATUS_LABELS[Number(s.status)] || 'Unknown'
        };
      }));

      setIncomingShipments(enrichedShipments);

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 3000);
    return () => clearInterval(timer);
  }, [contract, entityInfo, account]);

  useEffect(() => {
    if (supplyData.drugId) {
      const selected = drugs.find(d => d.drugId === supplyData.drugId);
      if (selected && selected.isBlocked) {
        setSupplyData(prev => ({ ...prev, drugId: '' }));
      }
    }
  }, [drugs, supplyData.drugId]);

  const handleSupplyRequest = (e) => {
    e.preventDefault();
    setConfirmModal({
      isOpen: true,
      data: { ...supplyData }
    });
  };

  const handleSupplyConfirm = async () => {
    const data = confirmModal.data;
    setConfirmModal({ isOpen: false, data: null });
    try {
      const success = await execute('supplyToRetailer', data.drugId, data.retailerId, Number(data.quantity));
      if (success) {
        toast.success(`Successfully transferred ${data.quantity} units to retailer ${data.retailerId}!`);
        setSupplyData({ drugId: '', retailerId: '', quantity: '' });
        fetchData();
      } else {
        toast.error(error || "Transfer failed on blockchain");
      }
    } catch(err) { console.error(err); }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verifyModal.code || !verifyModal.shipment) return;

    try {
      const trimmedCode = verifyModal.code.trim();
      const success = await execute('receiveShipment', verifyModal.shipment.id, trimmedCode);

      // Report telemetry
      fetch(`http://localhost:3001/api/shipments/${verifyModal.shipment.id}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success, reason: success ? 'Wholesaler received shipment' : 'Invalid verification code' })
      }).catch(console.error);

      if (success) {
        toast.success('?? Shipment verified & received! Inventory updated on blockchain.');
        setVerifyModal({ isOpen: false, shipment: null, code: '', error: '' });
        fetchData();
      } else {
        setVerifyModal(prev => ({ ...prev, error: '? Invalid verification code! Hash mismatch on blockchain.' }));
        toast.error('Invalid verification code!');
      }
    } catch(err) {
      console.error(err);
      toast.error('Transaction failed');
    }
  };

  const pieData = [
    { name: 'In Stock', value: drugs.length > 0 ? drugs.filter(d => !d.isRecalled).length : 1 },
    { name: 'Recalled', value: drugs.filter(d => d.isRecalled).length }
  ];
  const COLORS = ['#10b981', '#ef4444'];

  const areaData = [
    { name: 'Batch 1', volume: 400 },
    { name: 'Batch 2', volume: 600 },
    { name: 'Batch 3', volume: 800 },
    { name: 'Batch 4', volume: 1200 }
  ];

  const pendingShipments = incomingShipments.filter(s => s.statusNum !== 4);

  const renderCommandCenter = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 overflow-y-auto pb-8 space-y-6">
      
      {pendingShipments.length > 0 && (
        <div className="bg-teal-500/10 border border-teal-500/30 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-[0_0_20px_rgba(20,184,166,0.15)]">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-teal-500/20 text-teal-400 rounded-2xl animate-pulse">
              <ClipboardCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Incoming Shipments Awaiting Verification</h3>
              <p className="text-slate-400 text-sm">{pendingShipments.length} physical payload(s) dispatched to this facility. Verify using manufacturer code.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/wholesaler/incoming')} 
            className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg hover:scale-105"
          >
            Review & Receive Deliveries &rarr;
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] -mr-16 -mt-16"></div>
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl"><Package className="w-6 h-6" /></div>
            <h3 className="text-slate-400 font-bold tracking-widest text-xs uppercase">Active Batches in Stock</h3>
          </div>
          <p className="text-4xl font-black text-white">{drugs.length}</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] -mr-16 -mt-16"></div>
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl"><Archive className="w-6 h-6" /></div>
            <h3 className="text-slate-400 font-bold tracking-widest text-xs uppercase">Total Units Received</h3>
          </div>
          <p className="text-4xl font-black text-white">{stats.totalReceived.toLocaleString()}</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl relative overflow-hidden group hover:border-purple-500/30 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] -mr-16 -mt-16"></div>
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl"><Store className="w-6 h-6" /></div>
            <h3 className="text-slate-400 font-bold tracking-widest text-xs uppercase">Units Supplied to Retailers</h3>
          </div>
          <p className="text-4xl font-black text-white">{stats.totalSupplied.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl h-[400px] flex flex-col">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center"><Activity className="w-5 h-5 mr-2 text-blue-400" /> Inventory Quality Ratio</h3>
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

        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl h-[400px] flex flex-col">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-emerald-400" /> Operational Volume</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="volume" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVol)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderIncoming = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8 flex flex-col overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center space-x-4 mb-2">
            <Truck className="w-8 h-8 text-teal-400" />
            <h2 className="text-3xl font-black text-white tracking-tight">Incoming Deliveries & Handoff</h2>
          </div>
          <p className="text-slate-400 text-sm ml-12">Cryptographically verify and receive pharmaceutical shipments dispatched by manufacturers.</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider">
          Refresh Ledger
        </button>
      </div>

      <div className="flex-1 overflow-x-auto rounded-xl border border-white/5 bg-black/40">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 text-slate-300 text-xs uppercase tracking-widest">
              <th className="p-4 font-bold border-b border-white/10 rounded-tl-xl">Shipment ID</th>
              <th className="p-4 font-bold border-b border-white/10">Medication / Batch</th>
              <th className="p-4 font-bold border-b border-white/10">Quantity</th>
              <th className="p-4 font-bold border-b border-white/10">Origin</th>
              <th className="p-4 font-bold border-b border-white/10">Transporter</th>
              <th className="p-4 font-bold border-b border-white/10">Status</th>
              <th className="p-4 font-bold border-b border-white/10 rounded-tr-xl">Verification Action</th>
            </tr>
          </thead>
          <tbody className="text-sm font-mono">
            {incomingShipments.map(s => (
              <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 font-bold text-blue-400">{s.id}</td>
                <td className="p-4 text-white font-sans">{s.drugName} <span className="text-xs text-slate-500 font-mono">({s.drugId})</span></td>
                <td className="p-4 text-emerald-400 font-bold">{s.quantity.toLocaleString()}</td>
                <td className="p-4 text-slate-300">{s.sourceId}</td>
                <td className="p-4 text-slate-300">{s.transporterId}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    s.statusNum === 4 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    s.statusNum === 2 ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 animate-pulse' :
                    'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {s.status}
                  </span>
                </td>
                <td className="p-4">
                  {s.statusNum === 4 ? (
                    <span className="flex items-center text-xs text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4 mr-1.5" /> Received
                    </span>
                  ) : (
                    <button 
                      onClick={() => setVerifyModal({ isOpen: true, shipment: s, code: '', error: '' })}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:scale-105"
                    >
                      Verify & Receive
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {incomingShipments.length === 0 && (
              <tr>
                <td colSpan="7" className="p-12 text-center text-slate-500 italic font-sans text-sm">
                  No incoming shipments recorded for this wholesaler yet. Dispatched shipments from manufacturers will appear here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  const renderSupply = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 overflow-y-auto pb-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          
          <div className="relative z-10 mb-8">
            <div className="flex items-center space-x-4 mb-2">
              <Send className="w-8 h-8 text-blue-400" />
              <h2 className="text-3xl font-black text-white tracking-tight">Supply Distribution</h2>
            </div>
            <p className="text-slate-400 text-sm ml-12">Transfer bulk pharmaceutical inventory to retail nodes on the ledger.</p>
          </div>

          {drugs.some(d => d.isBlocked) && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-red-300">Regulator Safety Lock Active</h4>
                <p className="text-xs text-red-400/80 mt-1">
                  {drugs.filter(d => d.isBlocked).length} batch(es) in your inventory have been flagged, quarantined, or recalled by authorities and are locked from downstream distribution.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSupplyRequest} className="space-y-6 relative z-10">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select Active Batch</label>
              <select 
                required 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                value={supplyData.drugId} 
                onChange={e => setSupplyData({...supplyData, drugId: e.target.value})}
              >
                <option value="" className="bg-slate-900 text-slate-400">Select a batch from inventory...</option>
                {drugs.filter(d => Number(d.remainingQty) > 0 && !d.isBlocked).map(d => (
                  <option key={d.drugId} value={d.drugId} className="bg-slate-900 text-white">
                    {d.drugName} (Qty Available: {Number(d.remainingQty)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Destination Retailer ID</label>
              <input 
                required 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600 font-mono" 
                placeholder="e.g. RET-001" 
                value={supplyData.retailerId} 
                onChange={e => setSupplyData({...supplyData, retailerId: e.target.value})} 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Transfer Quantity</label>
              <input 
                required 
                type="number" 
                min="1" 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600 font-mono" 
                placeholder="0" 
                value={supplyData.quantity} 
                onChange={e => setSupplyData({...supplyData, quantity: e.target.value})} 
              />
            </div>

            <button 
              disabled={isLoading} 
              className={`w-full py-4 rounded-xl font-bold tracking-widest text-sm uppercase transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] ${isLoading ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 hover:scale-[1.02]'}`}
            >
              {isLoading ? 'Executing Smart Contract...' : 'Sign & Transfer Ownership'}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );

  const renderInventory = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8 flex flex-col overflow-y-auto">
      <div className="flex items-center space-x-4 mb-8">
        <Package className="w-8 h-8 text-blue-400" />
        <h2 className="text-3xl font-black text-white tracking-tight">Master Inventory Ledger</h2>
      </div>
      
      <div className="flex-1 overflow-x-auto rounded-xl border border-white/5 bg-black/40">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 text-slate-300 text-xs uppercase tracking-widest">
              <th className="p-4 font-bold border-b border-white/10 rounded-tl-xl">Batch ID</th>
              <th className="p-4 font-bold border-b border-white/10">Medication Name</th>
              <th className="p-4 font-bold border-b border-white/10">Available Units</th>
              <th className="p-4 font-bold border-b border-white/10">Manufacturer</th>
              <th className="p-4 font-bold border-b border-white/10 rounded-tr-xl">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {drugs.map(d => (
              <tr key={d.drugId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 font-mono text-blue-400 font-bold">{d.drugId}</td>
                <td className="p-4 font-bold text-white">{d.drugName}</td>
                <td className="p-4 text-emerald-400 font-bold font-mono">{Number(d.remainingQty).toLocaleString()}</td>
                <td className="p-4 text-slate-400 font-mono text-xs">{d.manufacturerId}</td>
                <td className="p-4">
                  {d.isRecalled ? (
                    <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold border border-red-500/30">RECALLED (LOCKED)</span>
                  ) : d.isQuarantined ? (
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold border border-amber-500/30">QUARANTINED (TEMP)</span>
                  ) : d.isBlocked ? (
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-bold border border-purple-500/30">{d.statusLabel}</span>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/30">SECURE IN STOCK</span>
                  )}
                </td>
              </tr>
            ))}
            {drugs.length === 0 && (
              <tr>
                <td colSpan="5" className="p-12 text-center text-slate-500 italic font-mono text-sm">
                  Inventory is empty. Verify incoming shipments to receive pharmaceuticals on the blockchain.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  const cleanPath = location.pathname.startsWith('/dashboard') 
    ? location.pathname.replace(/^\/dashboard/, '') 
    : location.pathname;
  const currentTab = cleanPath === '' || cleanPath === '/' || cleanPath === '/wholesaler' ? '/wholesaler' : cleanPath;

  return (
    <div className="relative h-[calc(100vh-8rem)] w-full">
      <div className="absolute inset-0">
        <div className={`absolute inset-0 transition-all duration-300 ${currentTab === '/wholesaler' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          {renderCommandCenter()}
        </div>
        <div className={`absolute inset-0 transition-all duration-300 ${currentTab === '/wholesaler/incoming' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          {renderIncoming()}
        </div>
        <div className={`absolute inset-0 transition-all duration-300 ${currentTab === '/wholesaler/supply' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          {renderSupply()}
        </div>
        <div className={`absolute inset-0 transition-all duration-300 ${currentTab === '/wholesaler/inventory' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          {renderInventory()}
        </div>
      </div>

      {/* Verification Modal */}
      <AnimatePresence>
        {verifyModal.isOpen && verifyModal.shipment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-teal-500/40 p-8 rounded-3xl shadow-2xl max-w-lg w-full relative overflow-hidden"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Key className="w-8 h-8 text-teal-400" />
                <div>
                  <h2 className="text-2xl font-black text-white">Cryptographic Delivery Handoff</h2>
                  <p className="text-slate-400 text-xs">Verify shipment {verifyModal.shipment.id}</p>
                </div>
              </div>

              <div className="bg-black/50 p-4 rounded-2xl border border-white/5 space-y-2 text-xs font-mono mb-6">
                <div className="flex justify-between"><span className="text-slate-500">Medication:</span><span className="text-white font-bold">{verifyModal.shipment.drugName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Batch ID:</span><span className="text-blue-400">{verifyModal.shipment.drugId}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Transfer Quantity:</span><span className="text-emerald-400 font-bold">{verifyModal.shipment.quantity.toLocaleString()} Units</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Origin Manufacturer:</span><span className="text-slate-300">{verifyModal.shipment.sourceId}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Assigned Transporter:</span><span className="text-slate-300">{verifyModal.shipment.transporterId}</span></div>
              </div>

              <form onSubmit={handleVerifySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-teal-300 uppercase tracking-widest mb-2">
                    Enter Delivery Verification Code
                  </label>
                  <input 
                    required 
                    autoFocus
                    placeholder="e.g. MC-XXXX-XXXX" 
                    value={verifyModal.code}
                    onChange={e => setVerifyModal(prev => ({ ...prev, code: e.target.value.toUpperCase(), error: '' }))}
                    className="w-full bg-black/60 border border-teal-500/50 rounded-xl px-4 py-3 text-center text-xl font-mono font-black text-teal-300 tracking-widest focus:ring-2 focus:ring-teal-400 outline-none uppercase placeholder:text-slate-700"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">This code was cryptographically generated by the manufacturer upon dispatch.</p>
                </div>

                {verifyModal.error && (
                  <div className="p-3 bg-red-950/80 border border-red-500/40 rounded-xl text-xs text-red-200 font-mono">
                    {verifyModal.error}
                  </div>
                )}

                <div className="flex space-x-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setVerifyModal({ isOpen: false, shipment: null, code: '', error: '' })}
                    className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isLoading || !verifyModal.code}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg ${
                      isLoading ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-500 text-white border border-teal-500'
                    }`}
                  >
                    {isLoading ? 'Verifying...' : 'Confirm Receipt'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-lg w-full"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Confirm Bulk Transfer</h2>
              <p className="text-slate-400 mb-6">Review the cryptographic transfer details before signing. This creates an immutable transfer record.</p>
              
              <div className="bg-black/50 p-4 rounded-xl border border-white/5 space-y-3 font-mono text-sm mb-8">
                <div className="flex justify-between"><span className="text-slate-500">Batch ID:</span><span className="text-blue-400 font-bold">{confirmModal.data.drugId}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Retailer Entity ID:</span><span className="text-white">{confirmModal.data.retailerId}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Transfer Quantity:</span><span className="text-emerald-400">{confirmModal.data.quantity} Units</span></div>
              </div>

              <div className="flex space-x-4">
                <button 
                  onClick={() => setConfirmModal({ isOpen: false, data: null })}
                  className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSupplyConfirm}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-900/50 transition-all"
                >
                  Sign Transfer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WholesalerDashboard;
