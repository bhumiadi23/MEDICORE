import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReadOnlyContract } from '../blockchain/contract';
import { ShieldCheck, FileText, Activity, AlertTriangle, Snowflake, Factory, Printer } from 'lucide-react';
import { formatDateTime, shortAddress, DRUG_STATUS_LABELS } from '../utils/helpers';
import Timeline from '../components/Timeline';
import QRCodeGenerator from '../components/QRCodeGenerator';
import StatusBadge from '../components/StatusBadge';

const DrugPassport = () => {
  const { drugId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const contract = await getReadOnlyContract();
        if(!contract) return;
        const drug = await contract.verifyDrug(drugId);
        setData(drug);
        
        try {
          const hist = await contract.getDrugHistory(drugId);
          setHistory(hist.map(h => ({
            status: DRUG_STATUS_LABELS[Number(h.status)],
            timestamp: h.timestamp,
            entity: h.entityWallet,
            entityName: h.entityId,
            role: 'Participant'
          })).reverse());
        } catch(e) {}
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (drugId) fetchData();
  }, [drugId]);

  if (loading) return <div className="p-12 text-center text-slate-500 font-medium">Loading passport data...</div>;
  if (!data || !data.exists) return <div className="p-12 text-center text-red-500 font-bold">Drug Passport Not Found</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-blue-100">
            <ShieldCheck className="h-4 w-4" /> Digital Product Passport
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">{data.drugName}</h1>
          <p className="text-slate-500 mt-2 font-mono text-lg">ID: {drugId}</p>
        </div>
        <div className="flex gap-4">
          <QRCodeGenerator drugId={drugId} size={100} />
        </div>
      </div>

      {data.isRecalled && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start">
          <AlertTriangle className="h-8 w-8 text-red-600 mr-4 flex-shrink-0" />
          <div>
            <h3 className="text-xl font-bold text-red-800">PRODUCT RECALLED</h3>
            <p className="text-red-700 font-medium mt-1">{data.recallReason}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6 flex items-center"><Factory className="mr-2 text-blue-500" /> Manufacturing Details</h3>
            
            <div className="grid grid-cols-2 gap-y-8 gap-x-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Manufacturer ID</p>
                <p className="font-semibold text-slate-800">{data.manufacturerId}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Wallet Address</p>
                <p className="font-mono text-sm text-slate-600 truncate">{data.manufacturerWallet}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date of Manufacture</p>
                <p className="font-medium text-slate-800">{formatDateTime(data.manufacturingDate)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Expiration Date</p>
                <p className="font-medium text-slate-800">{formatDateTime(data.expiryDate)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6">Supply Chain Provenance</h3>
            {history.length > 0 ? (
              <Timeline events={history} />
            ) : (
              <p className="text-slate-500 italic">No supply chain events recorded yet.</p>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-md font-bold text-slate-900 mb-4">Current Status</h3>
            <div className="mb-4">
              <StatusBadge type={data.isRecalled ? 'danger' : 'info'} text={DRUG_STATUS_LABELS[Number(data.status)] || 'Unknown'} />
            </div>
            
            <h3 className="text-md font-bold text-slate-900 mt-8 mb-4 border-t border-slate-100 pt-4 flex items-center"><Snowflake className="mr-2 h-4 w-4 text-blue-500"/> Storage Requirements</h3>
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500">Temperature</span>
                <span className="font-medium">2°C - 8°C</span>
              </li>
              <li className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500">Humidity</span>
                <span className="font-medium">35% - 60%</span>
              </li>
              <li className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500">Light Exposure</span>
                <span className="font-medium">Protect from light</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-md font-bold text-slate-900 mb-4 flex items-center"><FileText className="mr-2 h-4 w-4 text-blue-500"/> Verified Documents</h3>
            <div className="space-y-3">
              {/* Mocking documents as requested to show UI */}
              <a href="#" className="flex items-center p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 group">
                <FileText className="h-4 w-4 mr-3 text-slate-400 group-hover:text-blue-500" /> Quality Certificate (CoA)
              </a>
              <a href="#" className="flex items-center p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 group">
                <FileText className="h-4 w-4 mr-3 text-slate-400 group-hover:text-blue-500" /> Origin Declaration
              </a>
            </div>
          </div>
          
          <button onClick={() => window.print()} className="w-full py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center">
            <Printer className="mr-2 h-4 w-4" /> Print Passport
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrugPassport;
