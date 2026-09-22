import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { useTransaction } from '../hooks/useTransaction';
import { Truck, CheckCircle2, AlertTriangle, Snowflake, Navigation, Map as MapIcon, Activity, Radio, Play, ShieldAlert, Thermometer, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDateTime } from '../utils/helpers';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area } from 'recharts';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const truckIcon = new L.DivIcon({
  className: 'bg-transparent',
  html: `<div class="bg-indigo-600 text-white p-2 rounded-full shadow-[0_0_20px_rgba(79,70,229,1)] border-2 border-white animate-pulse flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h2"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const facilityIcon = new L.DivIcon({
  className: 'bg-transparent',
  html: `<div class="bg-slate-800 text-slate-300 p-1.5 rounded-md shadow-[0_0_10px_rgba(0,0,0,0.5)] border border-slate-600"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V9l9-7 9 7v12M9 21V12h6v9"/></svg></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
};

const INDIA_LOCATIONS = {
  'Mumbai': { coords: [19.0760, 72.8777], hub: 'BOM-Logistics', state: 'Maharashtra', pin: '400001' },
  'Delhi': { coords: [28.7041, 77.1025], hub: 'DEL-ColdStore', state: 'Delhi', pin: '110001' },
  'Bengaluru': { coords: [12.9716, 77.5946], hub: 'BLR-Bio', state: 'Karnataka', pin: '560001' },
  'Chennai': { coords: [13.0827, 80.2707], hub: 'MAA-Pharma', state: 'Tamil Nadu', pin: '600001' },
  'Kolkata': { coords: [22.5726, 88.3639], hub: 'CCU-Gateway', state: 'West Bengal', pin: '700001' },
  'Hyderabad': { coords: [17.3850, 78.4867], hub: 'HYD-Chain', state: 'Telangana', pin: '500001' },
  'Pune': { coords: [18.5204, 73.8567], hub: 'PNQ-Transit', state: 'Maharashtra', pin: '411001' },
  'Ahmedabad': { coords: [23.0225, 72.5714], hub: 'AMD-Hub', state: 'Gujarat', pin: '380001' }
};
const CITY_KEYS = Object.keys(INDIA_LOCATIONS);
const SHIPMENT_STATUSES = ['Preparing', 'Dispatched', 'In Transit', 'Arrived', 'Delivered', 'Delayed', 'Quarantined'];

const GlowingStatCard = ({ icon: Icon, title, value, color }) => (
  <div className={`relative overflow-hidden rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-${color}-500/20 p-6 flex flex-col justify-between h-32 shadow-[0_0_15px_rgba(0,0,0,0.3)] shadow-${color}-500/10`}>
    <div className={`absolute -right-10 -top-10 w-32 h-32 bg-${color}-500/10 rounded-full blur-3xl`}></div>
    <div className="flex justify-between items-start relative z-10">
      <p className="text-slate-400 font-bold text-[10px] tracking-widest uppercase">{title}</p>
      <div className={`p-2 rounded-lg bg-${color}-500/10 border border-${color}-500/20`}>
        <Icon className={`h-5 w-5 text-${color}-400`} />
      </div>
    </div>
    <h3 className={`text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-${color}-200 relative z-10`}>
      {value}
    </h3>
  </div>
);

const generateCurvedLine = (latlng1, latlng2) => {
  const lat1 = latlng1[0], lng1 = latlng1[1];
  const lat2 = latlng2[0], lng2 = latlng2[1];
  const offsetX = (lat2 - lat1) * 0.2;
  const offsetY = (lng2 - lng1) * 0.2;
  const midLat = (lat1 + lat2) / 2 - offsetY; 
  const midLng = (lng1 + lng2) / 2 + offsetX;
  const points = [];
  for (let t = 0; t <= 1; t += 0.05) {
    const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * midLat + t * t * lat2;
    const lng = (1 - t) * (1 - t) * lng1 + 2 * (1 - t) * t * midLng + t * t * lng2;
    points.push([lat, lng]);
  }
  return points;
};

const TransporterDashboard = () => {
  const location = useLocation();
  const { account, contract } = useWeb3();
  const { execute, isLoading } = useTransaction();
  
  const [shipments, setShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
    // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0); 
  const [telemetry, setTelemetry] = useState([]); 
  const simIntervalRef = useRef(null);
  
  // Presenter Override Refs
  const isPausedRef = useRef(false);
  const forcedTempRef = useRef(null);

  useEffect(() => {
    fetchShipments();
    return () => clearInterval(simIntervalRef.current);
  }, [account, contract]);

  const fetchShipments = async () => {
    if (!contract || !account) return;
    try {
      const data = await contract.getShipmentsByTransporter(account);
      // Ensure we don't erase our local DEMO shipments when the blockchain syncs!
      setShipments(prev => {
        const demoShipments = prev.filter(s => s.id.startsWith('DEMO-'));
        // If it's the very first load and we have localStorage demo shipments, use those too
        const storedDemo = JSON.parse(localStorage.getItem('demo_shipments') || '[]');
        
        // Merge blockchain data with Demo data, prioritizing existing React state demo data over localStorage
        const mergedDemos = [...demoShipments];
        storedDemo.forEach(sd => {
          if (!mergedDemos.find(d => d.id === sd.id)) {
            mergedDemos.push(sd);
          }
        });

        const formatted = data.map((d, idx) => {
          const startCity = CITY_KEYS[idx % CITY_KEYS.length];
          const endCity = CITY_KEYS[(idx + 2) % CITY_KEYS.length];
          return {
            id: d.shipmentId || `BLOCKCHAIN-${idx}`,
            drugId: d.drugId,
            startCity: startCity,
            endCity: endCity,
            startCoords: INDIA_LOCATIONS[startCity].coords,
            endCoords: INDIA_LOCATIONS[endCity].coords,
            route: `${startCity} -> ${endCity}`,
            curvedPath: generateCurvedLine(INDIA_LOCATIONS[startCity].coords, INDIA_LOCATIONS[endCity].coords),
            distance: Math.floor(Math.random() * 1000 + 500),
            statusIndex: Number(d.status),
            status: SHIPMENT_STATUSES[Number(d.status)] || 'Unknown',
            recipient: d.destinationId || d.currentOwner
          };
        });

        return [...mergedDemos, ...formatted];
      });
    } catch (error) {
      console.error("Failed to fetch shipments:", error);
    }
  };

  const activeShipments = shipments.filter(s => ['Preparing', 'Dispatched', 'In Transit', 'Delayed', 'Quarantined', 'Arrived'].includes(s.status));
  
  const startSimulation = async () => {
    if (!selectedShipment || isSimulating) return;
    setIsSimulating(true);
    setSimProgress(0);
    isPausedRef.current = false;
    forcedTempRef.current = null;
    setTelemetry([{ time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}), temp: 4.5 }]);
    
    // Wait for MetaMask signature and blockchain confirmation before starting the truck engine!
    const success = await handleBlockchainSync(2); 
    if (!success) {
      setIsSimulating(false);
      return; // Stop if they rejected the transaction
    }

    simIntervalRef.current = setInterval(() => {
      setSimProgress(prev => {
        if (isPausedRef.current) return prev; // Do not move truck if paused
        const next = prev + 2; 
        
        setTelemetry(tPrev => {
          const lastTemp = tPrev[tPrev.length - 1].temp;
          let nextTemp;
          
          if (forcedTempRef.current !== null) {
            // Rapid drift toward the forced temperature (for presentation breach)
            nextTemp = lastTemp + (forcedTempRef.current > lastTemp ? 1.5 : -1.5);
            if (Math.abs(nextTemp - forcedTempRef.current) < 1.5) nextTemp = forcedTempRef.current;
            nextTemp = Number(nextTemp.toFixed(1));
          } else {
            // Normal random safe drift
            const drift = (Math.random() - 0.5) * 1.5; 
            nextTemp = Number((lastTemp + drift).toFixed(1));
            if (nextTemp > 8.5) nextTemp = 7.5;
            if (nextTemp < 1.5) nextTemp = 2.5;
          }
          
          return [...tPrev, { time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}), temp: nextTemp }].slice(-15);
        });

        if (next >= 100) {
          clearInterval(simIntervalRef.current);
          setIsSimulating(false);
          handleBlockchainSync(3); 
          return 100;
        }
        return next;
      });
    }, 1000);
  };

  // Presenter Controls
  const triggerBreach = async () => {
    const success = await handleBlockchainSync(6); // Quarantined
    if (success) forcedTempRef.current = 10.2;
  };
  const triggerDelay = async () => {
    const success = await handleBlockchainSync(5); // Delayed
    if (success) isPausedRef.current = true;
  };
  const resumeNormal = async () => {
    const success = await handleBlockchainSync(2); // Back to In Transit
    if (success) {
      isPausedRef.current = false;
      forcedTempRef.current = 4.5;
    }
  };

  const handleBlockchainSync = async (statusCode) => {
    try {
      if (selectedShipment.id.startsWith('DEMO-')) {
        // Bypass blockchain for presentation demo mode
        setShipments(prev => prev.map(s => s.id === selectedShipment.id ? {...s, status: SHIPMENT_STATUSES[statusCode], statusIndex: statusCode} : s));
        setSelectedShipment(prev => ({...prev, status: SHIPMENT_STATUSES[statusCode], statusIndex: statusCode}));
        await new Promise(r => setTimeout(r, 800));
        return true;
      }
      await execute('updateShipmentStatus', selectedShipment.id, statusCode);
      fetchShipments(); 
      return true;
    } catch (error) {
      console.error("Sync failed", error);
      return false;
    }
  };

  const handleCompleteShipment = async () => {
    try {
      if (selectedShipment.id.startsWith('DEMO-')) {
        setShipments(prev => prev.map(s => s.id === selectedShipment.id ? {...s, status: 'Delivered', statusIndex: 4} : s));
        setSelectedShipment(null);
        return;
      }
      await execute('completeShipment', selectedShipment.id);
      setSelectedShipment(null);
      fetchShipments();
    } catch (error) {
      console.error("Complete failed", error);
    }
  };

  const [demoStart, setDemoStart] = useState('Mumbai');
  const [demoEnd, setDemoEnd] = useState('Delhi');

  // Load demo shipments from localStorage on mount if they exist, to persist across routes
  useEffect(() => {
    try {
      const stored = localStorage.getItem('demo_shipments');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0) {
          // Merge with fetched shipments (we don't overwrite blockchain ones)
          setShipments(prev => {
            const nonDemo = prev.filter(s => !s.id.startsWith('DEMO-'));
            return [...parsed, ...nonDemo];
          });
        }
      }
    } catch(e) {}
  }, []);

  // Save demo shipments whenever shipments array changes
  useEffect(() => {
    const demoOnly = shipments.filter(s => s.id.startsWith('DEMO-'));
    localStorage.setItem('demo_shipments', JSON.stringify(demoOnly));
  }, [shipments]);

  const spawnDemoShipment = () => {
    if (demoStart === demoEnd) return; // Basic validation
    const demo = {
      id: 'DEMO-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      drugId: 'VACCINE-X-992',
      startCity: demoStart,
      endCity: demoEnd,
      startCoords: INDIA_LOCATIONS[demoStart].coords,
      endCoords: INDIA_LOCATIONS[demoEnd].coords,
      route: `${demoStart} -> ${demoEnd}`,
      curvedPath: generateCurvedLine(INDIA_LOCATIONS[demoStart].coords, INDIA_LOCATIONS[demoEnd].coords),
      distance: Math.floor(Math.random() * 1000 + 500),
      statusIndex: 1,
      status: 'Preparing',
      recipient: '0xMockRetailer...89F',
      createdAt: Date.now() / 1000,
    };
    setShipments(prev => [demo, ...prev]);
  };

  const getCurrentPosition = () => {
    if (!selectedShipment) return [20.5937, 78.9629];
    if (simProgress === 0) return selectedShipment.startCoords;
    if (simProgress === 100) return selectedShipment.endCoords;
    
    const path = selectedShipment.curvedPath;
    const index = Math.floor((simProgress / 100) * (path.length - 1));
    return path[index];
  };

  const currentPos = getCurrentPosition();
  const latestTemp = telemetry.length > 0 ? telemetry[telemetry.length - 1].temp : 4.5;
  const isBreach = latestTemp > 8 || latestTemp < 2;

  // View Renders based on routing
  const renderLiveShipments = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0 absolute inset-0">
      {/* Left: Map */}
      <div className="md:col-span-2 rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative bg-slate-900 flex flex-col h-full">
        <div className="absolute top-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-lg flex items-center space-x-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-black tracking-widest uppercase text-white">Live GPS Tracker</span>
        </div>

        <div className="flex-1 relative">
          <MapContainer center={[20.5937, 78.9629]} zoom={4} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}>
            {/* Standard OSM TileLayer with CSS inverted for dark mode (bypasses API key issues) */}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="map-tiles"
            />
            <MapController center={selectedShipment ? currentPos : [20.5937, 78.9629]} zoom={selectedShipment ? (isSimulating ? 6 : 5) : 4} />
            
            {!selectedShipment && activeShipments.map(s => (
              <React.Fragment key={s.id}>
                <Polyline positions={s.curvedPath} color="#4f46e5" weight={3} dashArray="5, 10" opacity={0.5} />
                <Marker position={s.startCoords} icon={facilityIcon} />
                <Marker position={s.endCoords} icon={facilityIcon} />
              </React.Fragment>
            ))}

            {selectedShipment && (
              <>
                <Polyline positions={selectedShipment.curvedPath} color="#4f46e5" weight={4} dashArray="5, 10" opacity={0.3} />
                <Marker position={selectedShipment.startCoords} icon={facilityIcon} />
                <Marker position={selectedShipment.endCoords} icon={facilityIcon} />
                <Marker position={currentPos} icon={truckIcon}>
                  <Popup className="dark-popup">
                    <div className="font-mono font-bold text-center">
                      Truck ID: {selectedShipment.id.substring(0,8)}<br/>
                      Temp: {latestTemp}&deg;C
                    </div>
                  </Popup>
                </Marker>
              </>
            )}
          </MapContainer>
        </div>
      </div>

      {/* Right: Telemetry */}
      <div className="flex flex-col space-y-6 overflow-y-auto h-full pb-6 pr-2">
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-6 flex flex-col relative shrink-0 min-h-[450px]">
          {!selectedShipment ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4 border border-indigo-500/20">
                <Navigation className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-lg font-black text-white tracking-wide">Select a Payload</h3>
              <p className="text-slate-400 text-sm mt-2 max-w-[200px]">Choose an active shipment to access telemetry.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-start mb-6 shrink-0">
                <div>
                  <h3 className="text-xl font-black text-white tracking-wide font-mono">{selectedShipment.id.substring(0,12)}...</h3>
                  <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mt-1">{selectedShipment.route}</p>
                </div>
                <button onClick={() => setSelectedShipment(null)} className="text-xs text-slate-500 hover:text-white uppercase font-bold tracking-widest transition-colors">
                  Deselect
                </button>
              </div>

              {/* IoT Graph */}
              <div className="flex-1 min-h-[150px] bg-black/40 rounded-2xl border border-white/5 p-4 relative mb-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <Activity className={`w-4 h-4 mr-2 ${isBreach ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">IoT Cold Chain Sensor</span>
                  </div>
                  <span className={`text-xl font-mono font-bold ${isBreach ? 'text-red-400' : 'text-white'}`}>
                    {latestTemp.toFixed(1)}&deg;C
                  </span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={telemetry}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 10]} hide />
                    <ReferenceLine y={8} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
                    <ReferenceLine y={2} stroke="#3b82f6" strokeDasharray="3 3" opacity={0.5} />
                    <Line type="monotone" dataKey="temp" stroke={isBreach ? '#ef4444' : '#10b981'} strokeWidth={3} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Status & Actions */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-4 shrink-0 relative overflow-hidden">
                {isSimulating && (
                  <div className="absolute top-0 right-0 p-2 opacity-50 flex items-center">
                    <Radio className="w-3 h-3 text-emerald-500 animate-ping mr-2" />
                    <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-widest">Node Synced</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Payload:</span>
                  <span className="text-white font-mono">{selectedShipment.drugId.substring(0,8)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Blockchain State:</span>
                  <span className={`font-bold uppercase tracking-wider ${
                    selectedShipment.status === 'Quarantined' ? 'text-red-400' :
                    selectedShipment.status === 'Delayed' ? 'text-amber-400' :
                    isSimulating ? 'text-indigo-400 animate-pulse' : 'text-slate-300'
                  }`}>
                    {selectedShipment.status === 'In Transit' && isSimulating ? 'In Transit (Live)' : selectedShipment.status}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mt-4 overflow-hidden">
                  <div className={`h-2 transition-all duration-300 ease-linear ${
                    selectedShipment.status === 'Quarantined' ? 'bg-red-500' :
                    selectedShipment.status === 'Delayed' ? 'bg-amber-500' :
                    'bg-indigo-500'
                  }`} style={{ width: `${simProgress}%` }}></div>
                </div>
              </div>

              {/* Main Action Button */}
              <div className="mt-6 shrink-0">
                {simProgress === 100 || selectedShipment.status === 'Arrived' || selectedShipment.status === 'Delivered' ? (
                  <button 
                    onClick={handleCompleteShipment}
                    disabled={isLoading}
                    className="w-full bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/50 py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50"
                  >
                    {isLoading ? "Signing..." : "Verify Delivery"}
                  </button>
                ) : !isSimulating ? (
                  <button 
                    onClick={startSimulation}
                    disabled={isLoading}
                    className="w-full relative overflow-hidden bg-indigo-600 text-white font-black tracking-widest uppercase py-4 rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] group flex items-center justify-center"
                  >
                    <span className="relative z-10 flex items-center">
                      <Play className="w-5 h-5 mr-2 fill-current" /> INITIATE TRANSPORT
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] skew-x-12"></div>
                  </button>
                ) : (
                  <div className="p-4 bg-slate-950/50 rounded-xl border border-white/5 space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Presenter Overrides</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={triggerBreach} className="py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border border-red-500/20">🔥 Force Breach</button>
                      <button onClick={triggerDelay} className="py-2 bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border border-amber-500/20">🛑 Pause / Delay</button>
                    </div>
                    <button onClick={resumeNormal} className="w-full py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border border-blue-500/20">✅ Restore Safe Ops</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* List of Shipments */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl overflow-hidden flex flex-col shrink-0 min-h-[350px]">
          <div className="p-4 border-b border-white/5 bg-black/20">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Fleet Routing</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 relative">
            {activeShipments.map(s => (
              <div 
                key={s.id} 
                onClick={() => !isSimulating && setSelectedShipment(s)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedShipment?.id === s.id ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-white/5 border-transparent hover:bg-white/10'} ${isSimulating && selectedShipment?.id !== s.id ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-white text-sm font-bold">{s.id.substring(0,8)}</span>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{s.status}</span>
                </div>
                <div className="flex items-center text-xs text-slate-400 font-mono">
                  <Navigation className="w-3 h-3 mr-1 text-slate-500" />
                  {s.startCity} &rarr; {s.endCity}
                </div>
              </div>
            ))}
            
            {activeShipments.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                <ShieldAlert className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-4">Select Routing Nodes</p>
                
                <div className="flex flex-col space-y-2 w-full max-w-[200px] mb-4">
                  <select 
                    value={demoStart} 
                    onChange={e => setDemoStart(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 text-xs text-white rounded-lg px-3 py-2 outline-none focus:border-indigo-500 font-bold uppercase tracking-wider"
                  >
                    {CITY_KEYS.map(city => <option key={city} value={city}>{city}</option>)}
                  </select>
                  <Navigation className="w-4 h-4 text-slate-500 mx-auto" />
                  <select 
                    value={demoEnd} 
                    onChange={e => setDemoEnd(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 text-xs text-white rounded-lg px-3 py-2 outline-none focus:border-indigo-500 font-bold uppercase tracking-wider"
                  >
                    {CITY_KEYS.map(city => <option key={city} value={city}>{city}</option>)}
                  </select>
                </div>

                <button 
                  onClick={spawnDemoShipment}
                  disabled={demoStart === demoEnd}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                >
                  SPAWN DEMO DATA
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderRoutes = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8 absolute inset-0 overflow-y-auto">
      <h2 className="text-2xl font-black text-white mb-6">Optimized Logistics Routes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {shipments.map(s => (
          <div key={s.id} className="bg-black/40 border border-white/5 p-6 rounded-2xl flex flex-col hover:border-indigo-500/30 transition-all cursor-pointer">
            <div className="flex justify-between items-center mb-4">
              <span className="font-mono text-indigo-400 font-bold">{s.id.substring(0, 10)}</span>
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-slate-300">{s.distance} mi</span>
            </div>
            <div className="flex items-center justify-between text-white font-black text-lg">
              <span>{s.startCity}</span>
              <div className="flex-1 border-b-2 border-dashed border-slate-600 mx-4 relative">
                <Truck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500 bg-slate-900 px-1" />
              </div>
              <span>{s.endCity}</span>
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-xs text-slate-400 uppercase font-bold">
              <span>HUB: {INDIA_LOCATIONS[s.startCity]?.hub}</span>
              <span>HUB: {INDIA_LOCATIONS[s.endCity]?.hub}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const renderColdChain = () => {
    const total = shipments.length || 1;
    const bad = shipments.filter(s => ['Quarantined', 'Delayed'].includes(s.status)).length;
    const compliance = (((total - bad) / total) * 100).toFixed(1);
    const avg = isSimulating ? latestTemp.toFixed(1) : "4.2";
    
    // Sync the fleet chart with live demo telemetry if simulating, otherwise show historical pattern
    const chartData = telemetry.length > 0 ? telemetry : [
      { time: '00:00', temp: 4.1 }, { time: '04:00', temp: 4.3 }, { time: '08:00', temp: 3.8 },
      { time: '12:00', temp: 4.5 }, { time: '16:00', temp: 4.2 }, { time: '20:00', temp: 4.4 }, { time: '24:00', temp: 4.1 }
    ];

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8 absolute inset-0 overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-white">Cold Chain Analytics</h2>
            <p className="text-slate-400 text-sm mt-1">{isSimulating ? 'LIVE: Synchronized with active payload telemetry' : 'Fleet-wide temperature telemetry'}</p>
          </div>
          <div className="flex space-x-4">
            <div className={`px-4 py-2 ${isBreach ? 'bg-red-500/10 border-red-500/20' : 'bg-blue-500/10 border-blue-500/20'} border rounded-xl transition-colors`}>
              <span className={`${isBreach ? 'text-red-400' : 'text-blue-400'} font-bold text-xs uppercase tracking-widest block`}>Avg Temp</span>
              <span className={`text-xl font-mono ${isBreach ? 'text-red-400' : 'text-white'}`}>{avg}&deg;C</span>
            </div>
            <div className={`px-4 py-2 ${Number(compliance) < 90 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'} border rounded-xl transition-colors`}>
              <span className={`${Number(compliance) < 90 ? 'text-amber-400' : 'text-emerald-400'} font-bold text-xs uppercase tracking-widest block`}>Compliance</span>
              <span className={`text-xl font-mono ${Number(compliance) < 90 ? 'text-amber-400' : 'text-white'}`}>{compliance}%</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 bg-black/40 rounded-2xl border border-white/5 p-6 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
            <Snowflake className={`w-64 h-64 ${isBreach ? 'text-red-500' : 'text-blue-500'} transition-colors`} />
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isBreach ? "#ef4444" : "#3b82f6"} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={isBreach ? "#ef4444" : "#3b82f6"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
              <XAxis dataKey="time" stroke="#94a3b8" tick={{fontFamily: 'monospace'}} />
              <YAxis domain={[0, 10]} stroke="#94a3b8" tick={{fontFamily: 'monospace'}} />
              <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} itemStyle={{ color: isBreach ? '#ef4444' : '#60a5fa' }} />
              <ReferenceLine y={8} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
              <ReferenceLine y={2} stroke="#3b82f6" strokeDasharray="3 3" opacity={0.5} />
              <Area type="monotone" dataKey="temp" stroke={isBreach ? "#ef4444" : "#3b82f6"} strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    );
  };

  const renderIncidents = () => {
    const issues = shipments.filter(s => ['Delayed', 'Quarantined'].includes(s.status));
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8 absolute inset-0 overflow-y-auto">
        <h2 className="text-2xl font-black text-white mb-6">Incident Reports</h2>
        {issues.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-emerald-500/30 bg-emerald-500/5 rounded-3xl">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
            <p className="text-emerald-400 font-bold tracking-widest uppercase">0 Active Incidents Detected</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {issues.map(s => (
              <div key={s.id} className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <span className="px-3 py-1 bg-red-500/20 rounded-full text-xs font-bold text-red-400 uppercase tracking-widest">{s.status}</span>
                  <span className="font-mono text-slate-400 text-sm">{formatDateTime(new Date().getTime())}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Shipment {s.id.substring(0,8)}</h3>
                <p className="text-slate-400 text-sm mb-4">Route: {s.route}</p>
                <button className="mt-auto w-full py-3 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl transition-all font-bold uppercase tracking-widest text-xs border border-red-500/30">
                  Investigate Breach
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  const renderHistory = () => {
    const completed = shipments.filter(s => s.status === 'Delivered');
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8 absolute inset-0 overflow-y-auto flex flex-col">
        <h2 className="text-2xl font-black text-white mb-6">Delivery History Ledger</h2>
        <div className="flex-1 overflow-x-auto rounded-xl border border-white/5 bg-black/40">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-slate-300 text-xs uppercase tracking-widest">
                <th className="p-4 font-bold border-b border-white/10 rounded-tl-xl">Shipment Hash</th>
                <th className="p-4 font-bold border-b border-white/10">Route</th>
                <th className="p-4 font-bold border-b border-white/10">Recipient ID</th>
                <th className="p-4 font-bold border-b border-white/10 rounded-tr-xl">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {completed.map((row, idx) => (
                <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 font-mono text-indigo-400 text-xs">{row.id}</td>
                  <td className="p-4 font-bold text-slate-300 text-xs">{row.route}</td>
                  <td className="p-4 text-slate-400 font-mono text-xs">{row.recipient}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">Verified</span>
                  </td>
                </tr>
              ))}
              {completed.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500 italic font-mono text-sm">No completed deliveries on ledger.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] flex-1 space-y-6 relative">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>

      {/* Top Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
        <GlowingStatCard icon={MapIcon} title="Active Routes" value={activeShipments.length} color="indigo" />
        <GlowingStatCard icon={CheckCircle2} title="Completed" value={shipments.filter(s=>s.status==='Delivered').length} color="emerald" />
        <GlowingStatCard icon={AlertTriangle} title="Quarantined" value={shipments.filter(s=>s.status==='Quarantined').length} color="red" />
        <GlowingStatCard icon={Radio} title="Network Nodes" value={`${CITY_KEYS.length} Active`} color="blue" />
      </div>

      {/* Main View Router - Using CSS opacity to prevent Leaflet Map from unmounting and breaking */}
      <div className="flex-1 min-h-0 relative">
        <div className={`absolute inset-0 transition-all duration-300 ${location.pathname === '/transporter' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          {renderLiveShipments()}
        </div>
        
        <div className={`absolute inset-0 transition-all duration-300 ${location.pathname === '/transporter/routes' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          {renderRoutes()}
        </div>
        
        <div className={`absolute inset-0 transition-all duration-300 ${location.pathname === '/transporter/cold-chain' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          {renderColdChain()}
        </div>
        
        <div className={`absolute inset-0 transition-all duration-300 ${location.pathname === '/transporter/incidents' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          {renderIncidents()}
        </div>
        
        <div className={`absolute inset-0 transition-all duration-300 ${location.pathname === '/transporter/history' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          {renderHistory()}
        </div>
      </div>

      {/* CSS for custom Map Tiles overriding Carto error and Popup theming */}
      <style dangerouslySetInnerHTML={{__html: `
        .map-tiles {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
        .leaflet-popup-content-wrapper, .leaflet-popup-tip {
          background-color: #0f172a !important;
          color: white !important;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 0 20px rgba(0,0,0,0.8) !important;
        }
      `}} />
    </div>
  );
};

export default TransporterDashboard;
