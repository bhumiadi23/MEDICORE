import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ScanLine, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QRScanner = ({ onScanSuccess, onScanError, onClose }) => {
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    // Create instance
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    // Success callback
    const onScan = (decodedText, decodedResult) => {
      // Pause scanning after successful read to prevent multiple triggers
      setIsScanning(false);
      html5QrcodeScanner.clear();
      onScanSuccess(decodedText);
    };

    // Error callback
    const onError = (errorMessage) => {
      if (onScanError) onScanError(errorMessage);
    };

    // Render
    html5QrcodeScanner.render(onScan, onError);
    scannerRef.current = html5QrcodeScanner;

    // Cleanup
    return () => {
      try {
        if (scannerRef.current && isScanning) {
          scannerRef.current.clear();
        }
      } catch (err) {
        console.warn("Cleanup warning: ", err);
      }
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full relative"
      >
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center text-white">
            <ScanLine className="h-5 w-5 mr-2 text-blue-400" />
            <h3 className="font-semibold">Scan Product Passport</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-2">
          {/* html5-qrcode injects DOM elements here */}
          <div id="qr-reader" className="w-full border-none overflow-hidden rounded-xl bg-slate-50"></div>
        </div>
        
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500 font-medium">Position the QR code inside the box to scan</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QRScanner;
