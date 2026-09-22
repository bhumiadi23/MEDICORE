import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useTransaction } from '../hooks/useTransaction';
import { useLocation } from 'react-router-dom';
import { Store, UserCircle, ShoppingCart, AlertTriangle, Clock, Package, ShieldAlert, CheckCircle2, TrendingUp, Archive } from 'lucide-react';
import { formatDateTime } from '../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion } from 'framer-motion';

const RetailerDashboard = () => {
  const { contract, entityInfo, account } = useWeb3();
  const { execute, isLoading } = useTransaction();
  const location = useLocation();
  const [drugs, setDrugs] = useState([]);
  const [sellData, setSellData] = useState({ drugId: '', customerId: '', quantity: '' });

  const fetchDrugs = async () => {
    if (!contract || !account) return;
    try {
      const inventory = await contract.getRetailerInventory(account);
      const activeInventory = inventory.filter(i => i.exists && Number(i.availableQty) > 0);
      
      const enrichedDrugs = await Promise.all(activeInventory.map(async (item) => {
        const batch = await contract.getDrug(item.drugId);
        return {
          drugId: item.drugId,
          drugName: item.drugName,
          remainingQty: item.availableQty,
          expiryDate: batch.expiryDate,
          isRecalled: batch.isRecalled
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

  const handleSell = async (e) => {
    e.preventDefault();
    try {
      const success = await execute('supplyToCustomer', sellData.drugId, sellData.customerId, Number(sellData.quantity));
      if (success) {
        setSellData({ drugId: '', customerId: '', quantity: '' });
        fetchDrugs();
      }
    } catch(err) { console.error(err); }
  };

  const chartData = drugs.length > 0 ? drugs.map(d => ({
    name: d.drugName,
    stock: Number(d.remainingQty)
  })).slice(0, 5) : [
    { name: 'Paracetamol', stock: 1200 },
    { name: 'Amoxicillin', stock: 850 },
    { name: 'Lisinopril', stock: 400 },
    { name: 'Atorvastatin', stock: 650 },
    { name: 'Metformin', stock: 920 }
  ];

  const loadDemoData = () => {
    setDrugs([
      { drugId: 'DEMO-BATCH-001', drugName: 'Paracetamol 500mg', remainingQty: 1450, expiryDate: Date.now()/1000 + 86400*300, isRecalled: false },
      { drugId: 'DEMO-BATCH-002', drugName: 'Amoxicillin 250mg', remainingQty: 800, expiryDate: Date.now()/1000 + 86400*12, isRecalled: false },
      { drugId: 'DEMO-BATCH-003', drugName: 'Lisinopril 10mg', remainingQty: 320, expiryDate: Date.now()/1000 + 86400*400, isRecalled: false },
      { drugId: 'DEMO-BATCH-004', drugName: 'Contaminated Syrup', remainingQty: 50, expiryDate: Date.now()/1000 + 86400*200, isRecalled: true }
    ]);
  };

  const salesVolume = [
    { time: '10:00', sales: 12 },
    { time: '12:00', sales: 45 },
    { time: '14:00', sales: 30 },
    { time: '16:00', sales: 65 },
    { time: '18:00', sales: 42 },
    { time: '20:00', sales: 18 }
  ];

  const expiringCount = drugs.filter(d => (Number(d.expiryDate) * 1000) - Date.now() < (30 * 24 * 60 * 60 * 1000)).length;

  const renderCommandCenter = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 overflow-y-auto pb-8 space-y-6">
      
      <div className="flex justify-end mb-4">
        <button onClick={loadDemoData} className="px-6 py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl font-bold tracking-widest text-xs uppercase transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]">
          Inject Demo Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] -mr-16 -mt-16"></div>
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl"><Store className="w-6 h-6" /></div>
            <h3 className="text-slate-400 font-bold tracking-widest text-xs uppercase">Inventory Items</h3>
          </div>
          <p className="text-4xl font-black text-white">{drugs.length}</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] -mr-16 -mt-16"></div>
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl"><ShoppingCart className="w-6 h-6" /></div>
            <h3 className="text-slate-400 font-bold tracking-widest text-xs uppercase">Items Dispensed</h3>
          </div>
          <p className="text-4xl font-black text-white">124</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] -mr-16 -mt-16"></div>
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl"><AlertTriangle className="w-6 h-6" /></div>
            <h3 className="text-slate-400 font-bold tracking-widest text-xs uppercase">Expiring Soon (30d)</h3>
          </div>
          <p className="text-4xl font-black text-white">{expiringCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl h-[400px] flex flex-col">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center"><Archive className="w-5 h-5 mr-2 text-emerald-400" /> Stock Levels by Molecule</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} tick={{fontSize: 11}} />
                <YAxis stroke="#64748b" axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Bar dataKey="stock" fill="#10b981" radius={[4,4,0,0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl h-[400px] flex flex-col">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-blue-400" /> Daily Dispensing Volume</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesVolume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderDispense = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 overflow-y-auto pb-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          
          <div className="relative z-10 mb-8">
            <div className="flex items-center space-x-4 mb-2">
              <UserCircle className="w-8 h-8 text-blue-400" />
              <h2 className="text-3xl font-black text-white tracking-tight">Point of Sale</h2>
            </div>
            <p className="text-slate-400 text-sm ml-12">Dispense verified medications directly to a patient's cryptographic identity.</p>
          </div>

          <form onSubmit={handleSell} className="space-y-6 relative z-10">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select Medication Batch</label>
              <select 
                required 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                value={sellData.drugId} 
                onChange={e => setSellData({...sellData, drugId: e.target.value})}
              >
                <option value="" className="bg-slate-900 text-slate-400">Scan or select a medication...</option>
                {drugs.filter(d => Number(d.remainingQty) > 0 && !d.isRecalled).map(d => (
                  <option key={d.drugId} value={d.drugId} className="bg-slate-900 text-white">
                    {d.drugName} (In Stock: {Number(d.remainingQty)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Patient / Customer ID</label>
              <input 
                required 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600" 
                placeholder="e.g. CUS-MUMBAI-01" 
                value={sellData.customerId} 
                onChange={e => setSellData({...sellData, customerId: e.target.value})} 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Quantity to Dispense</label>
              <input 
                required 
                type="number" 
                min="1"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600" 
                placeholder="0"
                value={sellData.quantity} 
                onChange={e => setSellData({...sellData, quantity: e.target.value})} 
              />
            </div>

            <button 
              disabled={isLoading} 
              className={`w-full py-4 rounded-xl font-bold tracking-widest text-sm uppercase transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center ${isLoading ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 hover:scale-[1.02]'}`}
            >
              {isLoading ? 'Executing Smart Contract...' : <><ShoppingCart className="w-5 h-5 mr-2" /> Process Sale</>}
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
        <h2 className="text-3xl font-black text-white tracking-tight">Pharmacy Ledger</h2>
      </div>
      
      <div className="flex-1 overflow-x-auto rounded-xl border border-white/5 bg-black/40">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 text-slate-300 text-xs uppercase tracking-widest">
              <th className="p-4 font-bold border-b border-white/10 rounded-tl-xl">Batch ID</th>
              <th className="p-4 font-bold border-b border-white/10">Medication Name</th>
              <th className="p-4 font-bold border-b border-white/10">In Stock</th>
              <th className="p-4 font-bold border-b border-white/10">Expiry Date</th>
              <th className="p-4 font-bold border-b border-white/10 rounded-tr-xl">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {drugs.map((drug, idx) => {
              const isExpiring = (Number(drug.expiryDate) * 1000) - Date.now() < (30 * 24 * 60 * 60 * 1000);
              return (
                <tr key={drug.drugId + idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 text-slate-400 font-mono text-xs">{drug.drugId}</td>
                  <td className="p-4 text-white font-bold">{drug.drugName}</td>
                  <td className="p-4 text-emerald-400 font-bold">{Number(drug.remainingQty)}</td>
                  <td className="p-4">
                    <span className={`font-mono text-xs flex items-center ${isExpiring ? 'text-amber-400 font-bold' : 'text-slate-300'}`}>
                      {isExpiring && <Clock className="w-3 h-3 mr-1" />}
                      {formatDateTime(drug.expiryDate).split(',')[0]}
                    </span>
                  </td>
                  <td className="p-4">
                    {drug.isRecalled ? (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-bold uppercase inline-flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/> Recalled</span>
                    ) : (
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-bold uppercase inline-flex items-center"><ShieldAlert className="w-3 h-3 mr-1"/> Available</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {drugs.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500">No pharmacy inventory found on the ledger.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] flex-1 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-900/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>
      
      <div className="flex-1 min-h-0 relative">
        <div className={`absolute inset-0 transition-all duration-300 ${location.pathname === '/retailer' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          {renderCommandCenter()}
        </div>
        <div className={`absolute inset-0 transition-all duration-300 ${location.pathname === '/retailer/dispense' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          {renderDispense()}
        </div>
        <div className={`absolute inset-0 transition-all duration-300 ${location.pathname === '/retailer/inventory' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          {renderInventory()}
        </div>
      </div>
    </div>
  );
};

export default RetailerDashboard;
