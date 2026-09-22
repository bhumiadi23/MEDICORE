import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Activity, ShieldCheck, Search, Github } from 'lucide-react';
import Navbar from '../components/Navbar';

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-slate-900">
      <Navbar />
      
      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>
      
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-6 w-6 text-blue-500" />
              <span className="text-xl font-bold text-white tracking-tight">MediCore <span className="text-blue-500">2.0</span></span>
            </div>
            
            <div className="flex space-x-6">
              <Link to="/verify" className="hover:text-white transition-colors flex items-center text-sm">
                <ShieldCheck className="h-4 w-4 mr-1.5" /> Verify Medicine
              </Link>
              <Link to="/track" className="hover:text-white transition-colors flex items-center text-sm">
                <Search className="h-4 w-4 mr-1.5" /> Track History
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm">Powered by Ethereum</span>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} MediCore 2.0. All rights reserved. Enterprise Pharmaceutical Traceability.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;

