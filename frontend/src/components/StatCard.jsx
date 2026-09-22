import React from 'react';

const StatCard = ({ icon: Icon, title, value, trend, trendUp }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {trend && (
          <p className={`text-xs mt-2 font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </p>
        )}
      </div>
      <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
        <Icon size={24} />
      </div>
    </div>
  );
};

export default StatCard;
