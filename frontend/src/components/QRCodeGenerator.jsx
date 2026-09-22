import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';

const QRCodeGenerator = ({ drugId, size = 150 }) => {
  const qrRef = useRef();
  
  // URL points to the verification page
  const verifyUrl = `${window.location.origin}/verify/${drugId}`;

  const downloadQR = () => {
    const svg = qrRef.current.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `drug-${drugId}-qr.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
      <div ref={qrRef} className="p-2 bg-white rounded">
        <QRCodeSVG value={verifyUrl} size={size} level="H" includeMargin={true} />
      </div>
      <button
        onClick={downloadQR}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
      >
        <Download size={16} /> Download QR Code
      </button>
    </div>
  );
};

export default QRCodeGenerator;
