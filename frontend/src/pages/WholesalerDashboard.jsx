import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useTransaction } from '../hooks/useTransaction';
import { useLocation } from 'react-router-dom';
import { Box, Send, Activity, Archive, Store, ShieldAlert, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatDateTime } from '../utils/helpers';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

const WholesalerDashboard = () => {
  const { contract, entityInfo, account } = useWeb3();
  const { execute, isLoading } = useTransaction();
  const location = useLocation();
  const [drugs, setDrugs] = useState([]);
  const [supplyData, setSupplyData] = useState({ drugId: '', retailerId: '', quantity: '' });

  const fetchDrugs = async () => {
    if (!contract || !account) return;
    try {
      const inventory = await contract.getWholesalerInventory(account);
      const activeInventory = inventory.filter(i => i.exists && Number(i.availableQty) > 0);
      
      const enrichedDrugs = await Promise.all(activeInventory.map(async (item) => {
        const batch = await contract.getDrug(item.drugId);
        return {
          drugId: item.drugId,
          drugName: item.drugName,
          remainingQty: item.availableQty,
          expiryDate: batch.expiryDate,
          isRecalled: batch.isRecalled,
          manufacturerId: batch.manufacturerId
        };
      }));
      
      setDrugs(enrichedDrugs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDrugs();
  }, [contract, entityInfo, account]);

  const handleSupply = async (e) => {
    e.preventDefault();
    try {
      const success = await execute('supplyToRetailer', supplyData.drugId, supplyData.retailerId, Number(supplyData.quantity));
      if (success) {
        setSupplyData({ drugId: '', retailerId: '', quantity: '' });
        fetchDrugs();
      }
    } catch(err) { console.error(err); }
  };

  const pieData = [
    { name: 'In Stock', value: drugs.length > 0 ? drugs.filter(d => !d.isRecalled).length : 45 },
    { name: 'Shipped', value: 120 },
    { name: 'Recalled', value: drugs.filter(d => d.isRecalled).length || 2 }
  ];
  const COLORS = ['#10b981', '#3b82f6', '#ef4444'];

  const loadDemoData = () => {
    setDrugs([
      { drugId: 'DEMO-BULK-001', drugName: 'Paracetamol 500mg (10k units)', remainingQty: 10000, expiryDate: Date.now()/1000 + 86400*300, isRecalled: false, manufacturerId: 'MFG-GLOBAL-01' },
      { drugId: 'DEMO-BULK-002', drugName: 'Amoxicillin 250mg (5k units)', remainingQty: 5000, expiryDate: Date.now()/1000 + 86400*12, isRecalled: false, manufacturerId: 'MFG-BIO-04' },
      { drugId: 'DEMO-BULK-003', drugName: 'Contaminated Syrup (1k units)', remainingQty: 1000, expiryDate: Date.now()/1000 + 86400*200, isRecalled: true, manufacturerId: 'MFG-SHADY-99' }
    ]);
  };

  const areaData = [
    { name: 'Mon', volume: 400 },
    { name: 'Tue', volume: 300 },
    { name: 'Wed', volume: 550 },
    { name: 'Thu', volume: 450 },
    { name: 'Fri', volume: 700 },
    { name: 'Sat', volume: 600 },
    { name: 'Sun', volume: 800 }
  ];

  const renderCommandCenter = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 overflow-y-auto pb-8 space-y-6">
      
      <div className="flex justify-end mb-4">
        <button onClick={loadDemoData} className="px-6 py-3 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-xl font-bold tracking-widest text-xs uppercase transition-all shadow-[0_0_15px_rgba(20,184,166,0.2)]">
          Inject Demo Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] -mr-16 -mt-16"></div>
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl"><Package className="w-6 h-6" /></div>
            <h3 className="text-slate-400 font-bold tracking-widest text-xs uppercase">Active Inventory</h3>
          </div>
          <p className="text-4xl font-black text-white">{drugs.length}</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] -mr-16 -mt-16"></div>
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl"><Archive className="w-6 h-6" /></div>
            <h3 className="text-slate-400 font-bold tracking-widest text-xs uppercase">Total Received</h3>
          </div>
          <p className="text-4xl font-black text-white">50</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl relative overflow-hidden group hover:border-purple-500/30 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] -mr-16 -mt-16"></div>
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl"><Store className="w-6 h-6" /></div>
            <h3 className="text-slate-400 font-bold tracking-widest text-xs uppercase">Supplied to Retailers</h3>
          </div>
          <p className="text-4xl font-black text-white">120</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl h-[400px] flex flex-col">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center"><Activity className="w-5 h-5 mr-2 text-blue-400" /> Inventory Status</h3>
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
          <h3 className="text-xl font-bold text-white mb-6 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-emerald-400" /> Distribution Volume</h3>
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

          <form onSubmit={handleSupply} className="space-y-6 relative z-10">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select Active Batch</label>
              <select 
                required 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                value={supplyData.drugId} 
                onChange={e => setSupplyData({...supplyData, drugId: e.target.value})}
              >
                <option value="" className="bg-slate-900 text-slate-400">Select a batch from inventory...</option>
                {drugs.filter(d => Number(d.remainingQty) > 0 && !d.isRecalled).map(d => (
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
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600" 
                placeholder="e.g. RET-MUMBAI-01" 
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
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600" 
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
              <th className="p-4 font-bold border-b border-white/10">Available Qty</th>
              <th className="p-4 font-bold border-b border-white/10">Manufacturer</th>
              <th className="p-4 font-bold border-b border-white/10 rounded-tr-xl">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {drugs.map((drug, idx) => (
              <tr key={drug.drugId + idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 text-slate-400 font-mono text-xs">{drug.drugId}</td>
                <td className="p-4 text-white font-bold">{drug.drugName}</td>
                <td className="p-4 text-blue-400 font-bold">{Number(drug.remainingQty)}</td>
                <td className="p-4 text-slate-300 font-mono text-xs">{drug.manufacturerId}</td>
                <td className="p-4">
                  {drug.isRecalled ? (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-bold uppercase inline-flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/> Recalled</span>
                  ) : (
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-bold uppercase inline-flex items-center"><ShieldAlert className="w-3 h-3 mr-1"/> Cleared</span>
                  )}
                </td>
              </tr>
            ))}
            {drugs.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500">No inventory found on the ledger.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] flex-1 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-900/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>
      
      <div className="flex-1 min-h-0 relative">
        <div className={`absolute inset-0 transition-all duration-300 ${location.pathname === '/wholesaler' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          {renderCommandCenter()}
        </div>
        <div className={`absolute inset-0 transition-all duration-300 ${location.pathname === '/wholesaler/supply' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          {renderSupply()}
        </div>
        <div className={`absolute inset-0 transition-all duration-300 ${location.pathname === '/wholesaler/inventory' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          {renderInventory()}
        </div>
      </div>
    </div>
  );
};

export default WholesalerDashboard;
