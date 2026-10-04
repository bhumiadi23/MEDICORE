import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { useTransaction } from '../hooks/useTransaction';
import { Building2, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { ROLE_ROUTES } from '../utils/helpers';
import { mockIpfs } from '../utils/mockIpfs';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position === null ? null : (
    <Marker position={position}></Marker>
  );
};

const Register = () => {
  const [formData, setFormData] = useState({ name: '', id: '', role: '1' });
  const [profileData, setProfileData] = useState({ facility: '', compliance: '' });
  const [position, setPosition] = useState([51.505, -0.09]);
  const { setEntityInfo } = useWeb3();
  const { execute, isLoading, error } = useTransaction();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const roleNum = Number(formData.role);
    const success = await execute('registerEntity', formData.name, formData.id, roleNum);
    if (success) {
      if ([1, 2, 3].includes(roleNum)) {
         const cid = await mockIpfs.upload({
           facility: profileData.facility,
           compliance: profileData.compliance,
           location: position
         });
         await execute('updateEntityProfile', formData.id, cid);
      }
      
      setEntityInfo({
        name: formData.name,
        id: formData.id,
        role: roleNum,
        isRegistered: true,
        isActive: true
      });
      navigate(ROLE_ROUTES[roleNum] || '/');
    }
  };

  const requiresProfile = ['1', '2', '3'].includes(formData.role);

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100"
      >
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center shadow-sm">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900">Entity Registration</h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">Join the secure MediCore network</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}
          
          <div className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1">Entity Name</label>
              <input
                id="name"
                type="text"
                required
                className="block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="e.g. PharmaCorp Global"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div>
              <label htmlFor="id" className="block text-sm font-semibold text-slate-700 mb-1">Official License ID</label>
              <input
                id="id"
                type="text"
                required
                className="block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
                placeholder="e.g. LIC-12345-XYZ"
                value={formData.id}
                onChange={(e) => setFormData({...formData, id: e.target.value})}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-semibold text-slate-700 mb-1">Network Role</label>
              <select
                id="role"
                className="block w-full pl-4 pr-10 py-3 text-base border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="1">Manufacturer</option>
                <option value="2">Wholesaler</option>
                <option value="3">Retailer</option>
                <option value="4">Customer</option>
                <option value="5">Transporter</option>
                <option value="6">Regulator (Observer)</option>
                <option value="7">Quality Officer</option>
              </select>
            </div>
            
            {requiresProfile && (
               <div className="space-y-5 border-t border-slate-200 pt-5 mt-5">
                 <h3 className="text-lg font-bold text-slate-800">Facility Location & Details</h3>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Facility Name / Address</label>
                    <input
                      type="text"
                      required
                      className="block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="e.g. Main Production Facility, New York"
                      value={profileData.facility}
                      onChange={(e) => setProfileData({...profileData, facility: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Compliance Details</label>
                    <textarea
                      required
                      className="block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="e.g. ISO 9001, FDA Approved"
                      value={profileData.compliance}
                      onChange={(e) => setProfileData({...profileData, compliance: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center">
                       <MapPin className="w-4 h-4 mr-1 text-slate-500" /> Facility Location (Click to set)
                    </label>
                    <div className="h-64 w-full rounded-lg overflow-hidden border border-slate-300 z-0">
                       <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
                         <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                         <LocationMarker position={position} setPosition={setPosition} />
                       </MapContainer>
                    </div>
                 </div>
               </div>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-4 px-4 border border-transparent text-lg font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-md ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Registering on Blockchain...' : 'Complete Registration'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;
