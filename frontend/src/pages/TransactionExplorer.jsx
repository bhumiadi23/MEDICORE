import React, { useState } from 'react';
import { Database, Search, ArrowRight, Box } from 'lucide-react';
import { formatDateTime, shortAddress } from '../utils/helpers';
import DataTable from '../components/DataTable';

const TransactionExplorer = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock event data to show UI
  const events = [
    { id: '0x1a2b...3c4d', event: 'DrugManufactured', drugId: 'BATCH-2023-A', from: '0xMFG...123', to: '-', block: 15432901, timestamp: Date.now() - 86400000 * 5 },
    { id: '0x5e6f...7a8b', event: 'QualityApproved', drugId: 'BATCH-2023-A', from: '0xQA...456', to: '-', block: 15433005, timestamp: Date.now() - 86400000 * 4 },
    { id: '0x9c0d...1e2f', event: 'Transferred', drugId: 'BATCH-2023-A', from: '0xMFG...123', to: '0xWHO...789', block: 15434102, timestamp: Date.now() - 86400000 * 3 },
    { id: '0x3g4h...5i6j', event: 'Transferred', drugId: 'BATCH-2023-A', from: '0xWHO...789', to: '0xRET...012', block: 15435200, timestamp: Date.now() - 86400000 * 1 },
    { id: '0x7k8l...9m0n', event: 'TemperatureViolation', drugId: 'BATCH-2023-B', from: '0xIOT...345', to: '-', block: 15435250, timestamp: Date.now() - 43200000 },
  ];

  const columns = [
    { header: 'Tx Hash', accessor: 'id', cell: r => <span className="font-mono text-blue-600 hover:underline cursor-pointer">{r.id}</span> },
    { header: 'Event', accessor: 'event', cell: r => (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
        r.event === 'TemperatureViolation' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
      }`}>{r.event}</span>
    ) },
    { header: 'Drug ID', accessor: 'drugId', cell: r => <span className="font-mono font-medium">{r.drugId}</span> },
    { header: 'From', accessor: 'from', cell: r => <span className="font-mono text-slate-500">{r.from}</span> },
    { header: 'To', accessor: 'to', cell: r => <span className="font-mono text-slate-500">{r.to}</span> },
    { header: 'Block', accessor: 'block', cell: r => <span className="text-slate-600 font-mono">{r.block}</span> },
    { header: 'Time', accessor: 'timestamp', cell: r => formatDateTime(r.timestamp / 1000) },
  ];

  const filteredEvents = events.filter(e => 
    e.drugId.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.event.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-slate-900 rounded-xl p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center">
          <Database className="h-10 w-10 text-blue-400 mr-4" />
          <div>
            <h2 className="text-2xl font-bold">Smart Contract Explorer</h2>
            <p className="text-slate-400 text-sm mt-1">Real-time immutable ledger of all supply chain events</p>
          </div>
        </div>
        
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-lg bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Search by Drug ID or Event..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 overflow-hidden">
        <DataTable columns={columns} data={filteredEvents} />
      </div>
    </div>
  );
};

export default TransactionExplorer;
