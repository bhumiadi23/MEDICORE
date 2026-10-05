import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { ShieldCheck, ShieldAlert, AlertTriangle, Search, XCircle, CheckCircle, PackageSearch, Clock, QrCode, Lock, Fingerprint, FileWarning } from 'lucide-react';
import { formatDateTime, shortAddress, DRUG_STATUS_LABELS, DRUG_STATUS_COLORS } from '../utils/helpers';
import Timeline from '../components/Timeline';
import { motion, AnimatePresence } from 'framer-motion';
import QRScanner from '../components/QRScanner';
import QRCodeGenerator from '../components/QRCodeGenerator';
import { useReactToPrint } from 'react-to-print';
import PassportCertificate from '../components/PassportCertificate';
import { useRef } from 'react';
import { useTransaction } from '../hooks/useTransaction';
import toast from 'react-hot-toast';

const DrugVerification = () => {
  const { drugId: urlDrugId } = useParams();
  const navigate = useNavigate();
  const { contract, entityInfo } = useWeb3();
  const { execute, isLoading: isTxLoading } = useTransaction();
  
  const [drugId, setDrugId] = useState(urlDrugId || '');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [tamperReports, setTamperReports] = useState([]);
  const [integrity, setIntegrity] = useState(null);
  const [showTamperModal, setShowTamperModal] = useState(false);
  const [tamperForm, setTamperForm] = useState({ sealId: '', description: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  const certificateRef = useRef();
  
  const handlePrintCertificate = useReactToPrint({
    content: () => certificateRef.current,
    documentTitle: `MediCore-Passport-${drugId || urlDrugId}`,
  });

  useEffect(() => {
    if (urlDrugId) {
      verifyDrug(urlDrugId);
    }
  }, [urlDrugId]);

  const handleScanSuccess = (decodedText) => {
    setShowScanner(false);
    
    // If the QR contains the full URL (e.g., http://localhost:5173/verify/PARA-001)
    // Extract just the ID part. Otherwise, assume it's just the ID.
    let extractedId = decodedText;
    if (decodedText.includes('/verify/')) {
      extractedId = decodedText.split('/verify/').pop();
    }
    
    setDrugId(extractedId);
    navigate(`/verify/${extractedId}`);
  };

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

      // Fetch cryptographic integrity & physical seal tamper reports
      try {
        if (contract.getBatchIntegrity) {
          const intg = await contract.getBatchIntegrity(id);
          setIntegrity({
            isRecalled: intg.isRecalled,
            isQuarantined: intg.isQuarantined,
            isFlagged: intg.isFlagged,
            isExpired: intg.isExpired,
            isTampered: intg.isTampered,
            isSafeToDispense: intg.isSafeToDispense
          });
        }
        if (contract.getTamperReports) {
          const reports = await contract.getTamperReports(id);
          setTamperReports(reports || []);
        }
      } catch (errIntg) {
        console.warn("Could not fetch integrity checks:", errIntg);
      }

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

  const handleReportTamperSubmit = async (e) => {
    e.preventDefault();
    if (!drugId || !tamperForm.sealId) return;
    try {
      const success = await execute('reportTampering', drugId, tamperForm.sealId, tamperForm.description || 'Packaging seal breached', 'IPFS-EVIDENCE-001');
      if (success) {
        toast.success(`Tampering reported on-chain! Batch ${drugId} has been locked & quarantined.`);
        setShowTamperModal(false);
        setTamperForm({ sealId: '', description: '' });
        verifyDrug(drugId);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to report tampering: ' + (err.reason || err.message));
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
              type="button"
              onClick={() => setShowScanner(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 font-semibold transition-colors flex items-center border-l border-slate-200"
            >
              <QrCode className="h-5 w-5 mr-2" />
              Scan QR
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 font-semibold transition-colors text-lg"
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>

        <AnimatePresence>
          {showScanner && (
            <QRScanner 
              onScanSuccess={handleScanSuccess} 
              onClose={() => setShowScanner(false)} 
            />
          )}
        </AnimatePresence>

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

            {/* Tamper-Evident Packaging Seal Card */}
            <div className={`rounded-2xl p-6 border shadow-sm ${
              tamperReports.length > 0 || integrity?.isTampered
                ? 'bg-red-50 border-red-300'
                : 'bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-200'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-2xl ${
                    tamperReports.length > 0 || integrity?.isTampered
                      ? 'bg-red-100 text-red-600'
                      : 'bg-teal-100 text-teal-700'
                  }`}>
                    {tamperReports.length > 0 || integrity?.isTampered ? (
                      <ShieldAlert className="w-8 h-8" />
                    ) : (
                      <Fingerprint className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-lg text-slate-900">Physical Packaging Seal Integrity</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                        tamperReports.length > 0 || integrity?.isTampered
                          ? 'bg-red-200 text-red-800'
                          : 'bg-teal-200 text-teal-800'
                      }`}>
                        {tamperReports.length > 0 || integrity?.isTampered ? 'TAMPER ALERT ACTIVE' : 'CRYPTOGRAPHICALLY SEALED'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      {tamperReports.length > 0 || integrity?.isTampered
                        ? `Packaging breach reported on-chain (${tamperReports.length} incident report(s)). Product is locked and quarantined.`
                        : 'Authentic cryptographic hologram seal registered at time of manufacture. Zero breaches recorded.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTamperModal(true)}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-md self-start md:self-auto"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Report Broken Seal</span>
                </button>
              </div>

              {tamperReports.length > 0 && (
                <div className="mt-4 pt-4 border-t border-red-200 space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-red-800">On-Chain Tamper Reports:</h5>
                  {tamperReports.map((t, idx) => (
                    <div key={idx} className="bg-white/80 p-3 rounded-xl border border-red-200 text-xs text-red-900 flex justify-between items-center">
                      <div>
                        <strong>Seal ID:</strong> <span className="font-mono">{t.sealId}</span> — {t.description}
                      </div>
                      <span className="font-mono text-slate-500 text-[10px]">Reporter: {t.reporterId || shortAddress(t.reporter)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mini Timeline & QR Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {history.length > 0 ? (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                  <h4 className="text-lg font-bold text-slate-900 mb-6">Supply Chain History</h4>
                  <Timeline events={history.slice(0, 3)} />
                  {history.length > 3 && (
                    <button onClick={() => navigate(`/passport/${urlDrugId}`)} className="w-full mt-4 py-3 bg-slate-50 text-blue-600 font-semibold rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                      View Full Digital Passport
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Supply Chain History</h4>
                  <p className="text-slate-500">This batch was recently minted and has no transfer history yet.</p>
                </div>
              )}
              
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 flex flex-col items-center justify-center">
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Digital Product Passport QR</h4>
                  <p className="text-sm text-slate-500 mb-6 text-center">Print this QR code and attach it to the physical packaging.</p>
                  <QRCodeGenerator drugId={urlDrugId} size={180} />
                </div>
              </div>

              {/* Download PDF Button */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => window.print()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center"
                >
                  Download PDF Product Passport
                </button>
              </div>

              {/* Hidden PDF Certificate Template */}
              <PassportCertificate 
                ref={certificateRef} 
                result={result} 
                history={history} 
                drugId={urlDrugId} 
              />
            </motion.div>
        )}

        {/* Report Tamper Modal */}
        <AnimatePresence>
          {showTamperModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-200"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Report Broken Packaging Seal</h3>
                    <p className="text-xs text-slate-500">Record an on-chain tamper alert and freeze this batch</p>
                  </div>
                </div>

                <form onSubmit={handleReportTamperSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Batch ID</label>
                    <input
                      disabled
                      value={drugId}
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Physical Hologram / Seal Serial ID</label>
                    <input
                      required
                      placeholder="e.g. SEAL-MFR-77291"
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 font-mono text-sm focus:ring-2 focus:ring-red-500 outline-none"
                      value={tamperForm.sealId}
                      onChange={e => setTamperForm({ ...tamperForm, sealId: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Observations & Defect Notes</label>
                    <textarea
                      required
                      rows="3"
                      placeholder="Describe the packaging damage, broken sticker, opened blister pack, or suspicious labeling..."
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                      value={tamperForm.description}
                      onChange={e => setTamperForm({ ...tamperForm, description: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowTamperModal(false)}
                      className="flex-1 py-3 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isTxLoading}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg shadow-red-500/30"
                    >
                      {isTxLoading ? 'Publishing...' : 'Submit Incident On-Chain'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DrugVerification;

