import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { useTransaction } from '../hooks/useTransaction';
import { Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ROLE_ROUTES } from '../utils/helpers';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', id: '', role: '1' });
  const { setEntityInfo } = useWeb3();
  const { execute, isLoading, error } = useTransaction();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await execute('registerEntity', formData.name, formData.id, Number(formData.role));
    if (success) {
      // Local context update
      setEntityInfo({
        name: formData.name,
        id: formData.id,
        role: Number(formData.role),
        isRegistered: true,
        isActive: true
      });
      navigate(ROLE_ROUTES[Number(formData.role)] || '/');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100"
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

