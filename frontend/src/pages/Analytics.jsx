import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Activity, Database, TrendingUp, AlertCircle } from 'lucide-react';
import StatCard from '../components/StatCard';

const Analytics = () => {
  // Demo Data
  const statusData = [
    { name: 'Available', value: 45 },
    { name: 'In Transit', value: 25 },
    { name: 'Delivered', value: 15 },
    { name: 'Recalled', value: 5 },
    { name: 'Quality Check', value: 10 },
  ];
  
  const inventoryData = [
    { role: 'Manufacturers', qty: 45000 },
    { role: 'Wholesalers', qty: 32000 },
    { role: 'Retailers', qty: 15000 },
    { role: 'Customers', qty: 8500 },
  ];

  const trendData = [
    { month: 'Jan', batches: 400, verifications: 2400 },
    { month: 'Feb', batches: 300, verifications: 1398 },
    { month: 'Mar', batches: 550, verifications: 9800 },
    { month: 'Apr', batches: 478, verifications: 3908 },
    { month: 'May', batches: 589, verifications: 4800 },
    { month: 'Jun', batches: 839, verifications: 3800 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#64748b', '#ef4444', '#f59e0b'];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Network Analytics</h2>
          <p className="text-slate-600 mt-1 flex items-center">
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded font-bold mr-2">DEMO DATA</span>
            Blockchain insights and metrics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Database} title="Total Transactions" value="124,592" trend="12%" trendUp={true} />
        <StatCard icon={Activity} title="Smart Contract Calls" value="45,910" trend="5%" trendUp={true} />
        <StatCard icon={AlertCircle} title="Anomaly Detections" value="142" trend="2%" trendUp={false} />
        <StatCard icon={TrendingUp} title="Active Nodes" value="28" trend="0%" trendUp={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border shadow-sm h-[400px]">
          <h3 className="font-bold text-slate-800 mb-6">Drug Status Distribution</h3>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm h-[400px]">
          <h3 className="font-bold text-slate-800 mb-6">Inventory by Role</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={inventoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis dataKey="role" type="category" width={100} tick={{fontSize: 12}} />
              <Tooltip cursor={{fill: '#f8fafc'}} />
              <Bar dataKey="qty" fill="#3b82f6" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border shadow-sm h-[400px]">
        <h3 className="font-bold text-slate-800 mb-6">Network Activity Trend</h3>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="batches" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4}} name="New Batches" />
            <Line yAxisId="right" type="monotone" dataKey="verifications" stroke="#10b981" strokeWidth={3} dot={{r: 4}} name="QR Verifications" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Analytics;
