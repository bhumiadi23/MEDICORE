import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { useTransaction } from '../hooks/useTransaction';
import { ShieldCheck, ShieldAlert, XCircle, Box, Truck, CheckCircle2 } from 'lucide-react';
import { formatDateTime } from '../utils/helpers';
import { ethers } from 'ethers';

const VerifyShipment = () => {
  const { shipmentId } = useParams();
  const { contract, entityInfo } = useWeb3();
  const { execute, isLoading } = useTransaction();
  
  const [shipment, setShipment] = useState(null);
  const [drug, setDrug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchShipment = async () => {
      if (!contract) return;
      try {
        setLoading(true);
        const data = await contract.getShipment(shipmentId);
        if (data.exists) {
          setShipment(data);
          const drugData = await contract.getDrug(data.drugId);
          setDrug(drugData);
        } else {
          setError("Shipment not found on blockchain.");
        }
      } catch (err) {
        console.error(err);
        setError("Error fetching shipment details.");
      } finally {
        setLoading(false);
      }
    };
    fetchShipment();
  }, [contract, shipmentId]);

  const isDestination = entityInfo && shipment && entityInfo.id === shipment.destinationId;

  const handleVerify = async () => {
    if (!verificationCode) return;
    try {
      let isSuccess = false;
      let reasonStr = "";
      let resultStatus = "";

      const hashedCode = ethers.keccak256(ethers.toUtf8Bytes(verificationCode));
      if (hashedCode === shipment.verificationHash) {
        if (drug.isRecalled) {
          isSuccess = true;
          reasonStr = 'Code is valid but the drug has been RECALLED.';
          resultStatus = 'WARNING RESULT';
        } else {
          isSuccess = true;
          reasonStr = 'Code is valid. Shipment can be securely received.';
          resultStatus = 'VERIFIED RESULT';
        }
      } else {
        isSuccess = false;
        reasonStr = 'Verification code is invalid. Do not accept shipment.';
        resultStatus = 'INVALID RESULT';
      }
      
      setVerificationResult({ status: resultStatus, message: reasonStr });

      try {
        await fetch(`http://localhost:3001/api/shipments/${shipmentId}/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: isSuccess, reason: reasonStr })
        });
      } catch (apiErr) {
        console.error("API error:", apiErr);
      }

    } catch(err) {
       console.error(err);
       setVerificationResult({ status: 'INVALID RESULT', message: 'Error verifying code.' });
       
       try {
         await fetch(`http://localhost:3001/api/shipments/${shipmentId}/scan`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ success: false, reason: 'Error verifying code.' })
         });
       } catch (apiErr) {
         console.error("API error:", apiErr);
       }
    }
  };

  const handleConfirmReceipt = async () => {
    if (!verificationCode) return;
    try {
      const success = await execute('receiveShipment', shipmentId, verificationCode);
      if (success) {
        alert("Shipment received successfully!");
        window.location.reload();
      }
    } catch(err) {
      console.error(err);
      if(err.data?.message) {
          alert(`Transaction failed: ${err.data.message}`);
      } else if (err.message) {
          alert(`Error: ${err.message}`);
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-white text-center">Loading shipment data...</div>;
  }

  if (error || !shipment) {
    return <div className="p-8 text-red-500 text-center font-bold">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden">
        <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-wide">Shipment Verification</h1>
        <p className="text-slate-400 text-sm mb-8">Secure Handoff Protocol</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-blue-400 border-b border-white/10 pb-2">Shipment Details</h3>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Shipment ID</span><span className="text-white">{shipment.shipmentId}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Status</span>
                <span className={Number(shipment.status) === 2 ? "text-emerald-400" : "text-yellow-400"}>
                   {Number(shipment.status) === 2 ? 'DELIVERED' : Number(shipment.status) === 0 ? 'CREATED' : 'IN TRANSIT'}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-slate-500">Quantity</span><span className="text-white">{Number(shipment.quantity)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Timestamp</span><span className="text-white">{formatDateTime(shipment.timestamp)}</span></div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-blue-400 border-b border-white/10 pb-2">Routing Details</h3>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Source ID</span><span className="text-white">{shipment.sourceId}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Dest ID</span><span className="text-white">{shipment.destinationId}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Transporter ID</span><span className="text-white">{shipment.transporterId}</span></div>
            </div>
          </div>
        </div>

        {drug && (
          <div className="bg-black/30 p-4 rounded-xl border border-white/5 mb-8">
            <h3 className="text-md font-bold text-teal-400 mb-3">Drug Verification</h3>
            <div className="grid grid-cols-2 gap-4 font-mono text-sm">
              <div><span className="text-slate-500 block">Name</span><span className="text-white">{drug.drugName}</span></div>
              <div><span className="text-slate-500 block">Batch ID</span><span className="text-white">{drug.drugId}</span></div>
              <div><span className="text-slate-500 block">Recalled</span>
                 {drug.isRecalled ? <span className="text-red-500 font-bold">YES</span> : <span className="text-emerald-500">NO</span>}
              </div>
            </div>
          </div>
        )}

        {isDestination && Number(shipment.status) !== 2 && (
          <div className="bg-blue-900/10 border border-blue-500/20 p-6 rounded-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Enter Verification Code</h3>
            <div className="flex space-x-4 mb-4">
              <input 
                type="text" 
                placeholder="MC-XXXX-XXXX"
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value)}
                className="flex-1 bg-black/40 border border-slate-700 rounded-xl px-5 py-3 text-white font-mono text-lg uppercase tracking-widest outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <button 
                onClick={handleVerify}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors"
              >
                Verify Code
              </button>
            </div>

            {verificationResult && (
              <div className={`p-4 rounded-xl border mb-4 flex items-start space-x-3 ${
                verificationResult.status === 'VERIFIED RESULT' ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400' :
                verificationResult.status === 'WARNING RESULT' ? 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400' :
                'bg-red-900/20 border-red-500/30 text-red-400'
              }`}>
                {verificationResult.status === 'VERIFIED RESULT' && <ShieldCheck className="w-6 h-6 shrink-0" />}
                {verificationResult.status === 'WARNING RESULT' && <ShieldAlert className="w-6 h-6 shrink-0" />}
                {verificationResult.status === 'INVALID RESULT' && <XCircle className="w-6 h-6 shrink-0" />}
                
                <div>
                  <h4 className="font-bold">{verificationResult.status}</h4>
                  <p className="text-sm opacity-90">{verificationResult.message}</p>
                </div>
              </div>
            )}

            {verificationResult && verificationResult.status === 'VERIFIED RESULT' && (
              <button 
                onClick={handleConfirmReceipt}
                disabled={isLoading}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black tracking-widest uppercase rounded-xl transition-all disabled:opacity-50 flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm Receipt on Blockchain</span>
              </button>
            )}
          </div>
        )}

        {Number(shipment.status) === 2 && (
          <div className="bg-emerald-900/20 border border-emerald-500/30 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
            <ShieldCheck className="w-16 h-16 text-emerald-400 mb-4" />
            <h3 className="text-2xl font-black text-emerald-400 tracking-wide mb-2">SHIPMENT DELIVERED</h3>
            <p className="text-emerald-400/80">This shipment has been verified and securely received by the destination.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyShipment;
