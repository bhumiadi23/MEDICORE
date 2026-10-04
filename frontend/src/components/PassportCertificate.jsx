import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatDateTime, DRUG_STATUS_LABELS } from '../utils/helpers';
import { ShieldCheck, ArrowDown, AlertTriangle, Fingerprint, Activity, Server, FileText, CheckCircle2 } from 'lucide-react';

const PassportCertificate = React.forwardRef(({ result, history, drugId }, ref) => {
  if (!result) return null;

  const verifyUrl = `${window.location.origin}/verify/${drugId}`;
  const isRecalled = result.isRecalled;
  const isExpired = result.isExpired || (new Date() > new Date(Number(result.expiryDate) * 1000));

  return (
    <div id="printable-certificate" className="print:block" style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
      <div ref={ref} className="p-10 bg-white text-slate-900 font-sans relative overflow-hidden" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', boxSizing: 'border-box' }}>
        
        {/* Background Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
          <ShieldCheck style={{ width: '600px', height: '600px' }} />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6 mb-6">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center mr-4">
                <ShieldCheck className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">MediCore</h1>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Decentralized Product Passport</p>
                <p className="text-xs text-slate-400 font-mono mt-1">Network: EVM Localhost (ChainID: 31337)</p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <QRCodeSVG value={verifyUrl} size={80} level="H" />
              </div>
            </div>
          </div>

          {/* Audit Status Banner */}
          <div className={`p-4 rounded-lg mb-8 border-2 flex items-center justify-between ${isRecalled ? 'bg-red-50 border-red-500 text-red-900' : 'bg-emerald-50 border-emerald-500 text-emerald-900'}`}>
            <div className="flex items-center">
              {isRecalled ? <AlertTriangle className="w-8 h-8 mr-3" /> : <CheckCircle2 className="w-8 h-8 mr-3" />}
              <div>
                <h2 className="text-xl font-black uppercase tracking-wide">
                  {isRecalled ? 'STATUS: CRITICAL RECALL' : 'STATUS: VERIFIED AUTHENTIC'}
                </h2>
                <p className="text-sm font-medium opacity-80">
                  {isRecalled ? `Reason: ${result.recallReason}` : 'Cryptographically secured and verified on the blockchain ledger.'}
                </p>
              </div>
            </div>
            <div className="text-right font-mono text-sm font-bold">
              ID: {drugId}
            </div>
          </div>

          {/* Grid Layout for Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Left Column: Product Specs */}
            <div>
              <div className="flex items-center mb-3 border-b border-slate-200 pb-2">
                <FileText className="w-5 h-5 mr-2 text-slate-700" />
                <h3 className="text-lg font-bold text-slate-800">Product Specifications</h3>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-slate-100"><td className="py-2 text-slate-500 font-semibold">Name</td><td className="py-2 font-bold text-right">{result.drugName}</td></tr>
                  <tr className="border-b border-slate-100"><td className="py-2 text-slate-500 font-semibold">Current State</td><td className="py-2 font-bold text-right">{DRUG_STATUS_LABELS[Number(result.status)]}</td></tr>
                  <tr className="border-b border-slate-100"><td className="py-2 text-slate-500 font-semibold">Mfg Date</td><td className="py-2 font-medium text-right">{formatDateTime(result.manufacturingDate)}</td></tr>
                  <tr className="border-b border-slate-100"><td className="py-2 text-slate-500 font-semibold">Expiry Date</td><td className={`py-2 font-medium text-right ${isExpired ? 'text-red-600 font-bold' : ''}`}>{formatDateTime(result.expiryDate)}</td></tr>
                  <tr><td className="py-2 text-slate-500 font-semibold">Condition</td><td className="py-2 font-bold text-right">{isExpired ? 'EXPIRED' : 'VALID'}</td></tr>
                </tbody>
              </table>
            </div>

            {/* Right Column: Origin Data */}
            <div>
              <div className="flex items-center mb-3 border-b border-slate-200 pb-2">
                <Server className="w-5 h-5 mr-2 text-slate-700" />
                <h3 className="text-lg font-bold text-slate-800">Origin Data</h3>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-slate-100"><td className="py-2 text-slate-500 font-semibold">Manufacturer ID</td><td className="py-2 font-bold text-right">{result.manufacturerId}</td></tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 text-slate-500 font-semibold">Origin Wallet</td>
                    <td className="py-2 font-mono text-xs text-right break-all max-w-[150px]">{result.manufacturer}</td>
                  </tr>
                  <tr className="border-b border-slate-100"><td className="py-2 text-slate-500 font-semibold">Batch Size</td><td className="py-2 font-bold text-right">{Number(result.manufacturedQty)} Units</td></tr>
                  <tr><td className="py-2 text-slate-500 font-semibold">Smart Contract</td><td className="py-2 font-mono text-xs text-right text-blue-600">0x5FbDB231...</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Chain of Custody Audit Log */}
          <div className="flex items-center mb-4 border-b-2 border-slate-900 pb-2">
            <Activity className="w-6 h-6 mr-2 text-slate-900" />
            <h3 className="text-xl font-black text-slate-900 uppercase">Cryptographic Audit Trail</h3>
          </div>
          
          <div className="space-y-0">
            {/* Origin Block */}
            <div className="flex border-l-2 border-slate-300 ml-4 pl-6 pb-6 relative">
              <div className="absolute w-4 h-4 rounded-full bg-slate-900 -left-[9px] top-1 border-4 border-white"></div>
              <div className="w-full bg-slate-50 p-4 rounded-r-lg border border-slate-200">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800 text-base uppercase">1. Genesis / Manufacturing</h4>
                  <span className="text-xs font-mono bg-slate-200 px-2 py-1 rounded text-slate-700">{formatDateTime(result.manufacturingDate)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-3 border-t border-slate-200 pt-3">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Entity</p>
                    <p className="font-bold">{result.manufacturerId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center"><Fingerprint className="w-3 h-3 mr-1"/> Genesis Signature</p>
                    <p className="font-mono text-xs text-slate-700 break-all">{result.manufacturer}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Transfer History Blocks */}
            {history.map((event, index) => (
              <div key={index} className="flex border-l-2 border-slate-300 ml-4 pl-6 pb-6 relative">
                <div className="absolute w-4 h-4 rounded-full bg-blue-500 -left-[9px] top-1 border-4 border-white"></div>
                <div className="w-full bg-white p-4 rounded-r-lg border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800 text-base uppercase">{index + 2}. Transferred to {event.toRole}</h4>
                    <span className="text-xs font-mono bg-blue-50 px-2 py-1 rounded text-blue-700 border border-blue-100">{formatDateTime(event.timestamp)}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm mt-3 border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Sender</p>
                      <p className="font-bold text-slate-700">{event.fromName || event.fromId}</p>
                      <p className="font-mono text-[10px] text-slate-500 mt-0.5 break-all flex"><Fingerprint className="w-3 h-3 mr-1 inline"/>{event.fromWallet}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Receiver</p>
                      <p className="font-bold text-blue-900">{event.toName || event.toId}</p>
                      <p className="font-mono text-[10px] text-blue-600 mt-0.5 break-all flex"><Fingerprint className="w-3 h-3 mr-1 inline"/>{event.toWallet}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Statement */}
          <div className="mt-8 pt-6 border-t-2 border-slate-200 text-justify">
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
              <strong>OFFICIAL AUDIT DOCUMENT:</strong> This Digital Product Passport was generated directly from the immutable records of the MediCore Blockchain Network. 
              All signatures listed in the Cryptographic Audit Trail correspond to verified Web3 wallets belonging to registered entities. 
              The integrity of this document can be independently verified by querying the underlying smart contract. 
              <br/><br/>
              <em>Generated on: {new Date().toLocaleString()} (System Time)</em>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PassportCertificate;
