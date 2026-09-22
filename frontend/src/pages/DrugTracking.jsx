import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getReadOnlyContract } from '../blockchain/contract';
import { Search, MapPin, Truck, Store, User, Building2, ArrowDown } from 'lucide-react';
import { formatDateTime, getRoleLabel } from '../utils/helpers';

const getRoleIcon = (role) => {
  switch(role) {
    case 1: return <Building2 className="text-blue-500" />;
    case 2: return <Truck className="text-orange-500" />;
    case 3: return <Store className="text-green-500" />;
    case 4: return <User className="text-purple-500" />;
    default: return <MapPin className="text-gray-500" />;
  }
};

const DrugTracking = () => {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';
  
  const [drugId, setDrugId] = useState(initialId);
  const [history, setHistory] = useState([]);
  const [drugDetails, setDrugDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTracking = async (idToSearch) => {
    if (!idToSearch) return;
    setIsLoading(true);
    setError(null);
    setHistory([]);
    setDrugDetails(null);
    
    try {
      if (idToSearch.startsWith('DEMO-')) {
        // Presentation Mode Bypass: Load demo data from localStorage
        const stored = JSON.parse(localStorage.getItem('demo_shipments') || '[]');
        let demo = stored.find(s => s.id === idToSearch);
        
        // If not found in transporter local storage (e.g., from Customer Dashboard mock), generate a default one
        if (!demo) {
           demo = {
             id: idToSearch,
             startCity: 'Mumbai',
             endCity: 'Delhi',
             status: idToSearch === 'DEMO-REC-007' ? 'Quarantined' : 'Delivered',
             createdAt: Date.now() / 1000 - 86400 * 5
           };
        }

        setTimeout(() => {
          setDrugDetails({
            drugName: idToSearch === 'DEMO-REC-007' ? 'NEURO-Z SYRUP' : idToSearch === 'DEMO-CAR-441' ? 'CARDIOPRIL 10MG' : 'Live VACCINE-X (DEMO)',
            drugId: idToSearch,
            manufacturingDate: demo.createdAt || (Date.now()/1000 - 86400),
            expiryDate: (Date.now()/1000) + 31536000,
            manufacturedQty: 500,
            isRecalled: demo.status === 'Quarantined',
            manufacturerId: 'MANUFACTURER-' + demo.startCity.toUpperCase(),
            createdAt: demo.createdAt || (Date.now()/1000 - 86400)
          });

          const demoHistory = [];
          // Mock the handover to transporter
          demoHistory.push({
            fromRole: 1, toRole: 5, quantity: 500,
            fromId: 'MANUFACTURER-' + demo.startCity.toUpperCase(),
            toId: 'TRANSPORTER-NODE',
            timestamp: demo.createdAt || (Date.now()/1000 - 3600)
          });

          // If it reached a later state, add more timeline events
          if (['In Transit', 'Delayed', 'Quarantined', 'Arrived', 'Delivered'].includes(demo.status)) {
            demoHistory.push({
              fromRole: 5, toRole: 5, quantity: 500,
              fromId: 'TRANSPORTER-NODE',
              toId: `HIGHWAY GPS: ${demo.status}`,
              timestamp: Date.now() / 1000 - 1800
            });
          }

          if (demo.status === 'Delivered') {
            demoHistory.push({
              fromRole: 5, toRole: 3, quantity: 500,
              fromId: 'TRANSPORTER-NODE',
              toId: 'RETAILER-' + demo.endCity.toUpperCase(),
              timestamp: Date.now() / 1000
            });
          }

          setHistory(demoHistory);
          setIsLoading(false);
        }, 800); // simulate network delay
        return;
      }

      const contract = await getReadOnlyContract();
      const drug = await contract.getDrug(idToSearch);
      if (!drug.exists) throw new Error("Drug not found");
      
      setDrugDetails(drug);
      
      const hist = await contract.getDrugHistory(idToSearch);
      setHistory(hist);
    } catch (err) {
      console.error(err);
      setError(err.message === "Demo shipment not found. Please spawn it in the Transporter Dashboard first." 
        ? err.message 
        : "Failed to fetch tracking data. Check ID.");
    } finally {
      if (!idToSearch.startsWith('DEMO-')) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) fetchTracking(initialId);
  }, [initialId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchTracking(drugId);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <MapPin className="mx-auto h-16 w-16 text-brand-600 mb-4" />
        <h1 className="text-3xl font-bold text-gray-900">Track Supply Chain Journey</h1>
        <p className="mt-2 text-gray-600">See the complete immutable history of a product's movement.</p>
      </div>

      <form onSubmit={handleSubmit} className="mb-12">
        <div className="flex max-w-2xl mx-auto shadow-sm rounded-lg overflow-hidden border border-gray-300">
          <input
            type="text"
            className="flex-1 px-4 py-3 focus:outline-none"
            placeholder="Enter Drug ID (e.g. BATCH-001)"
            value={drugId}
            onChange={(e) => setDrugId(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={isLoading}
            className="bg-brand-900 hover:bg-brand-800 text-white px-6 font-medium transition-colors"
          >
            {isLoading ? 'Searching...' : 'Track'}
          </button>
        </div>
      </form>

      {error && <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg">{error}</div>}

      {drugDetails && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-10">
          <div className="bg-brand-50 px-6 py-4 border-b border-brand-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-brand-900">{drugDetails.drugName}</h2>
            <span className="font-mono text-sm text-brand-600 bg-brand-100 px-3 py-1 rounded-full">{drugDetails.drugId}</span>
          </div>
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-gray-500">Mfg Date</p><p className="font-semibold">{formatDateTime(drugDetails.manufacturingDate)}</p></div>
            <div><p className="text-gray-500">Expiry Date</p><p className="font-semibold">{formatDateTime(drugDetails.expiryDate)}</p></div>
            <div><p className="text-gray-500">Initial Qty</p><p className="font-semibold">{Number(drugDetails.manufacturedQty)}</p></div>
            <div><p className="text-gray-500">Status</p><p className="font-semibold">{drugDetails.isRecalled ? 'RECALLED' : 'ACTIVE'}</p></div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="relative border-l-2 border-brand-200 ml-6 pb-4 space-y-10">
          {/* Origin Node (Manufacturing) */}
          <div className="relative pl-8">
            <div className="absolute -left-5 bg-white border-4 border-brand-500 h-10 w-10 rounded-full flex items-center justify-center">
              <Building2 className="h-5 w-5 text-brand-500" />
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-500 mb-1 block">Origin (Manufacturer)</span>
              <h3 className="text-lg font-bold text-gray-900">{drugDetails.manufacturerId}</h3>
              <p className="text-sm text-gray-500 mt-2">Manufactured Quantity: {Number(drugDetails.manufacturedQty)}</p>
              <p className="text-xs text-gray-400 mt-1">{formatDateTime(drugDetails.createdAt)}</p>
            </div>
          </div>

          {/* Transfers */}
          {history.map((tx, idx) => (
            <div key={idx} className="relative pl-8">
              <div className="absolute -left-5 bg-white border-2 border-gray-300 h-10 w-10 rounded-full flex items-center justify-center z-10">
                {getRoleIcon(Number(tx.toRole))}
              </div>
              
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Transfer</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-mono">Qty: {Number(tx.quantity)}</span>
                </div>
                
                <div className="flex items-center space-x-4 my-4">
                  <div className="flex-1 border p-3 rounded bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">{getRoleLabel(Number(tx.fromRole))}</p>
                    <p className="font-semibold text-sm truncate" title={tx.fromId}>{tx.fromId}</p>
                  </div>
                  <ArrowDown className="text-gray-400 -rotate-90 flex-shrink-0" />
                  <div className="flex-1 border p-3 rounded bg-blue-50 border-blue-100">
                    <p className="text-xs text-blue-500 mb-1">{getRoleLabel(Number(tx.toRole))}</p>
                    <p className="font-semibold text-sm truncate text-blue-900" title={tx.toId}>{tx.toId}</p>
                  </div>
                </div>
                
                <p className="text-xs text-gray-400 text-right">{formatDateTime(tx.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {drugDetails && history.length === 0 && (
        <div className="text-center p-8 bg-gray-50 rounded-xl border border-gray-200 text-gray-500">
          No transfers recorded yet. The product is still with the manufacturer.
        </div>
      )}
    </div>
  );
};

export default DrugTracking;
