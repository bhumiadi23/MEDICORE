import React, { useState, useEffect } from 'react';
import { Activity, Thermometer, Droplets, MapPin, AlertTriangle, Send } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { IOT_SCENARIOS, generateIoTReading } from '../services/iotSimulator';
import { formatDateTime } from '../utils/helpers';
import toast from 'react-hot-toast';

const IoTSimulator = () => {
  const [drugId, setDrugId] = useState('BATCH-DEMO-001');
  const [shipmentId, setShipmentId] = useState('SHP-1234');
  const [isSimulating, setIsSimulating] = useState(false);
  const [readings, setReadings] = useState([]);
  const [currentReading, setCurrentReading] = useState(null);

  useEffect(() => {
    let interval;
    if (isSimulating) {
      interval = setInterval(() => {
        triggerReading(IOT_SCENARIOS.NORMAL);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isSimulating, drugId, shipmentId]);

  const triggerReading = (scenario) => {
    const reading = generateIoTReading(drugId, shipmentId, scenario);
    setCurrentReading(reading);
    setReadings(prev => {
      const newReadings = [...prev, { time: new Date().toLocaleTimeString(), temp: reading.temperature, hum: reading.humidity }];
      return newReadings.slice(-20); // Keep last 20
    });

    if (reading.isViolation) {
      toast.error(`Violation Detected: ${scenario}`, { duration: 4000 });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-slate-900 rounded-xl p-4 flex justify-between items-center text-white">
        <div className="flex items-center font-mono">
          <Activity className="text-green-400 mr-3 animate-pulse" /> IOT SENSOR SIMULATOR - Demo Mode
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Control Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-6">Device Configuration</h3>
          
          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Drug Batch ID</label>
              <input value={drugId} onChange={e => setDrugId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm font-mono" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Shipment ID</label>
              <input value={shipmentId} onChange={e => setShipmentId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm font-mono" />
            </div>
            
            <button 
              onClick={() => setIsSimulating(!isSimulating)}
              className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${isSimulating ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {isSimulating ? 'Stop Data Stream' : 'Start Normal Data Stream'}
            </button>
          </div>

          <h3 className="font-bold text-slate-900 mb-4 border-t pt-6">Trigger Anomalies</h3>
          <div className="space-y-3">
            <button onClick={() => triggerReading(IOT_SCENARIOS.HIGH_TEMP)} className="w-full py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 flex items-center justify-center text-sm font-medium">
              <Thermometer className="w-4 h-4 mr-2" /> Inject High Temp (&gt;8°C)
            </button>
            <button onClick={() => triggerReading(IOT_SCENARIOS.LOW_TEMP)} className="w-full py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center justify-center text-sm font-medium">
              <Thermometer className="w-4 h-4 mr-2" /> Inject Low Temp (&lt;2°C)
            </button>
            <button onClick={() => triggerReading(IOT_SCENARIOS.HUMIDITY_VIOLATION)} className="w-full py-2 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg hover:bg-yellow-100 flex items-center justify-center text-sm font-medium">
              <Droplets className="w-4 h-4 mr-2" /> Inject High Humidity
            </button>
          </div>
        </div>

        {/* Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <div className="flex items-center text-slate-500 mb-2"><Thermometer className="w-4 h-4 mr-2" /> Temperature</div>
              <div className={`text-4xl font-mono font-bold ${(currentReading?.temperature > 8 || currentReading?.temperature < 2) ? 'text-red-500' : 'text-slate-900'}`}>
                {currentReading ? currentReading.temperature.toFixed(2) : '--'}°C
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <div className="flex items-center text-slate-500 mb-2"><Droplets className="w-4 h-4 mr-2" /> Humidity</div>
              <div className={`text-4xl font-mono font-bold ${currentReading?.humidity > 60 ? 'text-red-500' : 'text-slate-900'}`}>
                {currentReading ? currentReading.humidity.toFixed(1) : '--'}%
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <div className="flex items-center text-slate-500 mb-2"><MapPin className="w-4 h-4 mr-2" /> GPS GPS</div>
              <div className="text-lg font-mono font-medium text-slate-700 mt-2">
                {currentReading ? `${currentReading.location.lat.toFixed(4)}, ${currentReading.location.lng.toFixed(4)}` : 'Waiting...'}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm h-80">
            <h3 className="font-bold text-slate-900 mb-4">Real-time Telemetry</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={readings}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" tick={{fontSize: 10}} />
                <YAxis domain={[-5, 20]} />
                <Tooltip />
                <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-white p-4 rounded-xl border shadow-sm flex justify-between items-center">
            <div className="flex items-center">
              <AlertTriangle className="text-yellow-500 mr-2" />
              <span className="text-sm font-medium">Violations are automatically written to the smart contract via Oracle.</span>
            </div>
            <button className="bg-slate-900 text-white px-4 py-2 rounded text-sm font-bold flex items-center">
              <Send className="w-4 h-4 mr-2"/> Force Sync
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IoTSimulator;
