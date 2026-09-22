import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Package, Clock, ExternalLink, Activity, AlertTriangle, Fingerprint, Dna, CheckCircle2, History } from 'lucide-react';
import QRCodeGenerator from '../components/QRCodeGenerator';
import { formatDateTime } from '../utils/helpers';
import { motion } from 'framer-motion';

const CustomerDashboard = () => {
  const { contract, entityInfo } = useWeb3();
  const location = useLocation();
  const [drugs, setDrugs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const MOCK_DEMO_DRUGS = [
    {
      drugId: 'DEMO-VAC-992',
      drugName: 'VACCINE-X-992',
      quantity: 1,
      manufacturingDate: Date.now() / 1000 - 86400 * 30,
      expiryDate: Date.now() / 1000 + 86400 * 335,
      isRecalled: false,
      authenticityScore: 99.98,
      status: 'VERIFIED_AUTHENTIC',
      manufacturer: 'FastMed Labs',
      receivedAt: Date.now() / 1000 - 3600 * 48,
      retailer: 'RETAILER-DELHI'
    },
    {
      drugId: 'DEMO-CAR-441',
      drugName: 'CARDIOPRIL 10MG',
      quantity: 3,
      manufacturingDate: Date.now() / 1000 - 86400 * 120,
      expiryDate: Date.now() / 1000 + 86400 * 245,
      isRecalled: false,
      authenticityScore: 99.85,
      status: 'VERIFIED_AUTHENTIC',
      manufacturer: 'GlobalPharma',
      receivedAt: Date.now() / 1000 - 86400 * 14,
      retailer: 'PHARMA-MUMBAI'
    },
    {
      drugId: 'DEMO-REC-007',
      drugName: 'NEURO-Z SYRUP',
      quantity: 1,
      manufacturingDate: Date.now() / 1000 - 86400 * 10,
      expiryDate: Date.now() / 1000 + 86400 * 350,
      isRecalled: true,
      authenticityScore: 45.20,
      status: 'RECALLED_CONTAMINATED',
      manufacturer: 'BioTech Inc',
      receivedAt: Date.now() / 1000 - 86400 * 2,
      retailer: 'MED-STORE-BLR'
    }
  ];

  const fetchDrugs = async () => {
    setIsLoading(true);
    try {
      let enrichedDrugs = [];
      if (contract && entityInfo?.id) {
        const inventory = await contract.getCustomerInventory(entityInfo.id);
        
        enrichedDrugs = await Promise.all(inventory.map(async (item) => {
          const batch = await contract.getDrug(item.drugId);
          return {
            drugId: item.drugId,
            drugName: item.drugName,
            quantity: item.quantity,
            manufacturingDate: batch.manufacturingDate,
            expiryDate: batch.expiryDate,
            isRecalled: batch.isRecalled,
            authenticityScore: batch.isRecalled ? 0 : 99.99,
            status: batch.isRecalled ? 'RECALLED' : 'VERIFIED_AUTHENTIC',
            manufacturer: 'Blockchain Verified',
            receivedAt: item.receivedAt,
            retailer: item.fromRetailerId
          };
        }));
      }
      setDrugs(enrichedDrugs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrugs();
  }, [contract, entityInfo]);

  const loadDemoData = () => {
    setDrugs(MOCK_DEMO_DRUGS);
  };

  const renderCabinet = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 overflow-y-auto pb-8">
      {/* Header */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-2">
            <Fingerprint className="w-8 h-8 text-blue-400" />
            <h2 className="text-3xl font-black text-white tracking-tight">My Digital Medicine Cabinet</h2>
          </div>
          <p className="text-slate-400 text-sm ml-12">Cryptographically verified prescriptions and authenticity scores.</p>
        </div>
        
        <div className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-4 relative z-10">
          <button onClick={loadDemoData} className="px-6 py-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl font-bold tracking-widest text-xs uppercase transition-all flex items-center shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Dna className="w-4 h-4 mr-2" /> Load Demo Cabinet
          </button>
          <Link to="/verify" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold tracking-widest text-xs uppercase transition-all flex items-center shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-500 hover:scale-105">
            <ShieldCheck className="w-4 h-4 mr-2" /> Verify New Drug
          </Link>
        </div>
      </div>

      {/* Grid of Medicines */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {drugs.map((drug, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            key={drug.drugId + i} 
            className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative flex flex-col group hover:border-blue-500/30 transition-all duration-500"
          >
            {/* Status Indicator Glow */}
            <div className={`absolute top-0 left-0 w-full h-1 ${drug.isRecalled ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]' : 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)]'}`}></div>
            
            <div className="p-8 flex-1">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl border ${drug.isRecalled ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                  {drug.isRecalled ? <AlertTriangle className="w-8 h-8" /> : <Package className="w-8 h-8" />}
                </div>
                
                <div className="text-right">
                  <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest ${drug.isRecalled ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                    {drug.isRecalled ? (
                      <><AlertTriangle className="w-3 h-3"/> <span>Quarantined</span></>
                    ) : (
                      <><CheckCircle2 className="w-3 h-3"/> <span>Verified Safe</span></>
                    )}
                  </div>
                </div>
              </div>
              
              <h3 className="text-2xl font-black text-white mb-2">{drug.drugName}</h3>
              <p className="text-slate-400 font-mono text-xs mb-6 px-3 py-1 bg-black/40 rounded-lg inline-block border border-white/5">{drug.drugId}</p>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-slate-500 text-sm flex items-center"><Activity className="w-4 h-4 mr-2" /> Authenticity Score</span>
                  <span className={`font-mono font-bold ${drug.isRecalled ? 'text-red-400' : 'text-emerald-400'}`}>{drug.authenticityScore}%</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-slate-500 text-sm flex items-center"><Clock className="w-4 h-4 mr-2" /> Manufactured</span>
                  <span className="text-slate-300 font-mono text-sm">{formatDateTime(drug.manufacturingDate).split(',')[0]}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm flex items-center"><Clock className="w-4 h-4 mr-2 text-red-500/50" /> Expiry</span>
                  <span className="text-red-400 font-mono text-sm">{formatDateTime(drug.expiryDate).split(',')[0]}</span>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="p-4 bg-black/20 border-t border-white/5 flex gap-4">
              <Link to={`/track?id=${drug.drugId}`} className="flex-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 py-3 rounded-xl font-bold tracking-widest text-xs uppercase transition-all flex items-center justify-center">
                <ExternalLink className="w-4 h-4 mr-2" /> Trace Origin
              </Link>
            </div>
          </motion.div>
        ))}

        {!isLoading && drugs.length === 0 && (
          <div className="col-span-full h-96 flex flex-col items-center justify-center border border-dashed border-white/10 bg-white/5 rounded-3xl">
            <Package className="h-16 w-16 text-slate-600 mb-6" />
            <h3 className="text-xl font-black text-white tracking-tight">Cabinet is Empty</h3>
            <p className="text-slate-400 mt-2 max-w-md text-center">You have not purchased any verified medications yet on the ledger.</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderHistory = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8 flex flex-col overflow-y-auto">
      <div className="flex items-center space-x-4 mb-8">
        <History className="w-8 h-8 text-blue-400" />
        <h2 className="text-3xl font-black text-white tracking-tight">Patient Prescription Ledger</h2>
      </div>
      
      <div className="flex-1 overflow-x-auto rounded-xl border border-white/5 bg-black/40">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 text-slate-300 text-xs uppercase tracking-widest">
              <th className="p-4 font-bold border-b border-white/10 rounded-tl-xl">Purchase Date</th>
              <th className="p-4 font-bold border-b border-white/10">Medication Name</th>
              <th className="p-4 font-bold border-b border-white/10">Batch ID</th>
              <th className="p-4 font-bold border-b border-white/10">Dispensed By</th>
              <th className="p-4 font-bold border-b border-white/10 rounded-tr-xl">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {drugs.map((drug, idx) => (
              <tr key={drug.drugId + idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 text-slate-300 font-mono">{formatDateTime(drug.receivedAt)}</td>
                <td className="p-4 text-white font-bold">{drug.drugName}</td>
                <td className="p-4 text-slate-400 font-mono text-xs">{drug.drugId}</td>
                <td className="p-4 text-blue-400">{drug.retailer}</td>
                <td className="p-4">
                  {drug.isRecalled ? (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-bold uppercase">Recalled</span>
                  ) : (
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-bold uppercase">Safe</span>
                  )}
                </td>
              </tr>
            ))}
            {drugs.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500">No prescriptions found on ledger. Click "Load Demo Cabinet" on the home tab to generate data.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] flex-1 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>
      
      <div className="flex-1 min-h-0 relative">
        <div className={`absolute inset-0 transition-all duration-300 ${location.pathname === '/customer' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          {renderCabinet()}
        </div>
        <div className={`absolute inset-0 transition-all duration-300 ${location.pathname === '/customer/history' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          {renderHistory()}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
