import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReadOnlyContract } from '../blockchain/contract';
import { ShieldCheck, AlertTriangle, Search, XCircle, CheckCircle, PackageSearch, Clock } from 'lucide-react';
import { formatDateTime, shortAddress, DRUG_STATUS_LABELS, DRUG_STATUS_COLORS } from '../utils/helpers';
import Timeline from '../components/Timeline';
import { motion } from 'framer-motion';

const DrugVerification = () => {
  const { drugId: urlDrugId } = useParams();
  const navigate = useNavigate();
  
  const [drugId, setDrugId] = useState(urlDrugId || '');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (urlDrugId) {
      verifyDrug(urlDrugId);
    }
  }, [urlDrugId]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!drugId) return;
    navigate(`/verify/${drugId}`);
  };

  const verifyDrug = async (id) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const contract = await getReadOnlyContract();
      if (!contract) throw new Error("Could not connect to network");
      
      const data = await contract.verifyDrug(id);
      
      if (!data.exists) {
        throw new Error("Drug not found or invalid ID.");
      }

      setResult({
        isAuthentic: true,
        drugName: data.drugName,
        manufacturingDate: data.manufacturingDate,
        expiryDate: data.expiryDate,
        isRecalled: data.isRecalled,
        recallReason: data.recallReason,
        manufacturer: data.manufacturerWallet,
        manufacturerId: data.manufacturerId,
        isExpired: data.isExpired,
        status: data.status
      });

      try {
        const historyData = await contract.getDrugHistory(id);
        const formattedHistory = historyData.map(h => ({
          status: DRUG_STATUS_LABELS[Number(h.status)] || 'Update',
          timestamp: h.timestamp,
          entity: h.entityWallet,
          entityName: h.entityId,
          role: 'Entity',
          location: 'Network'
        }));
        setHistory(formattedHistory.reverse());
      } catch(e) {
        console.warn("Could not fetch history:", e);
      }

    } catch (err) {
      console.error(err);
      setError("Product Not Authentic. This batch ID does not exist in the blockchain registry.");
      setResult({ isAuthentic: false });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      
      {/* Hero Video Section */}
      <div className="w-full relative py-20 px-4 flex justify-center items-center overflow-hidden bg-slate-900 border-b border-slate-200 shadow-sm">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute min-w-full min-h-full object-cover opacity-50 z-0"
        >
          <source src="/MediCore-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-slate-900/60 mix-blend-multiply z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10"></div>
        
        <div className="text-center relative z-20 max-w-3xl w-full">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/20 backdrop-blur-md border border-blue-400/30 rounded-2xl mb-6 shadow-2xl">
            <ShieldCheck className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 drop-shadow-md">Verify Medicine Authenticity</h1>
          <p className="text-xl text-blue-100 font-medium drop-shadow-sm max-w-2xl mx-auto">Enter the unique Product ID or scan the QR code to verify origin and safety on the blockchain.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full px-4 -mt-10 relative z-30">
        <form onSubmit={handleVerify} className="mb-10 shadow-2xl rounded-xl">
          <div className="flex shadow-sm rounded-xl overflow-hidden border border-slate-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
            <div className="px-5 py-4 bg-slate-50 border-r border-slate-200 flex items-center text-slate-500">
              <PackageSearch className="h-5 w-5" />
            </div>
            <input
              type="text"
              className="flex-1 px-5 py-4 focus:outline-none text-lg"
              placeholder="Enter Drug or Batch ID..."
              value={drugId}
              onChange={(e) => setDrugId(e.target.value)}
            />
            <button 
              type="submit" 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 font-semibold transition-colors text-lg"
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 border border-red-200 text-red-800 p-8 rounded-2xl flex items-start shadow-sm">
            <XCircle className="h-8 w-8 mr-4 flex-shrink-0 text-red-500" />
            <div>
              <h3 className="font-bold text-xl mb-2">Verification Failed</h3>
              <p className="text-red-700 font-medium">{error}</p>
              <div className="mt-4 p-4 bg-red-100 rounded-lg text-sm font-semibold">
                WARNING: This product could be counterfeit. Do not consume. Contact authorities immediately.
              </div>
            </div>
          </motion.div>
        )}

        {result?.isAuthentic && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* Status Card */}
            <div className={`p-8 rounded-2xl border-2 ${result.isRecalled ? 'bg-red-50 border-red-400' : 'bg-green-50 border-green-400'} shadow-sm`}>
              <div className="flex items-center">
                {result.isRecalled ? (
                  <AlertTriangle className="h-12 w-12 text-red-600 mr-5" />
                ) : (
                  <CheckCircle className="h-12 w-12 text-green-600 mr-5" />
                )}
                <div>
                  <h2 className={`text-2xl font-bold ${result.isRecalled ? 'text-red-800' : 'text-green-800'}`}>
                    {result.isRecalled ? 'PRODUCT RECALLED' : 'AUTHENTIC PRODUCT'}
                  </h2>
                  <p className={result.isRecalled ? 'text-red-700 font-medium mt-1' : 'text-green-700 font-medium mt-1'}>
                    {result.isRecalled ? 'DO NOT CONSUME. RETURN TO SELLER.' : 'Cryptographically verified on MediCore Network'}
                  </p>
                </div>
              </div>
              {result.isRecalled && (
                <div className="mt-6 p-4 bg-white border border-red-200 rounded-lg shadow-sm">
                  <p className="text-sm font-bold text-red-800 uppercase tracking-wide">Recall Reason</p>
                  <p className="mt-1 text-red-900">{result.recallReason || 'Critical safety concern.'}</p>
                </div>
              )}
            </div>

            {/* Details Card */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-100">{result.drugName}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Batch ID</p>
                  <p className="font-mono font-medium text-slate-800">{urlDrugId}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Current Status</p>
                  <p className="font-semibold text-blue-600">{DRUG_STATUS_LABELS[Number(result.status)] || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Manufacturer</p>
                  <p className="font-medium text-slate-800">{result.manufacturerId}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{shortAddress(result.manufacturer)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Manufacturing Date</p>
                  <p className="font-medium text-slate-800 flex items-center"><Clock className="w-4 h-4 mr-1 text-slate-400" /> {formatDateTime(result.manufacturingDate)}</p>
                </div>
                <div className={result.isExpired ? 'text-red-600' : ''}>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Expiry Date</p>
                  <p className="font-medium flex items-center"><Clock className="w-4 h-4 mr-1 opacity-60" /> {formatDateTime(result.expiryDate)}</p>
                  {result.isExpired && <span className="text-xs font-bold bg-red-100 px-2 py-0.5 rounded mt-1 inline-block">EXPIRED</span>}
                </div>
              </div>
            </div>

            {/* Mini Timeline */}
            {history.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <h4 className="text-lg font-bold text-slate-900 mb-6">Supply Chain History</h4>
                <Timeline events={history.slice(0, 3)} />
                {history.length > 3 && (
                  <button onClick={() => navigate(`/passport/${urlDrugId}`)} className="w-full mt-4 py-3 bg-slate-50 text-blue-600 font-semibold rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                    View Full Digital Passport
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DrugVerification;

