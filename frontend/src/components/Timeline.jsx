import React from 'react';
import { CheckCircle2, Clock, Truck, ShieldAlert, Factory, Store, User } from 'lucide-react';
import { formatDateTime } from '../utils/helpers';

const getRoleIcon = (roleName) => {
  switch (roleName?.toLowerCase()) {
    case 'manufacturer': return Factory;
    case 'wholesaler': return Truck;
    case 'retailer': return Store;
    case 'customer': return User;
    case 'transporter': return Truck;
    case 'regulator': return ShieldAlert;
    case 'quality officer': return CheckCircle2;
    default: return Clock;
  }
};

const Timeline = ({ events }) => {
  if (!events || events.length === 0) return <p className="text-gray-500">No events found.</p>;

  return (
    <div className="relative border-l border-gray-200 ml-3">
      {events.map((event, index) => {
        const Icon = getRoleIcon(event.role);
        return (
          <div key={index} className="mb-10 ml-6 relative">
            <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full -left-10 ring-4 ring-white">
              <Icon className="w-4 h-4 text-blue-600" />
            </span>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-1">
                <h3 className="flex items-center text-lg font-semibold text-gray-900">
                  {event.status || 'Status Update'}
                </h3>
                <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {formatDateTime(event.timestamp)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                By: <span className="font-medium text-gray-800">{event.entityName || event.entity}</span> ({event.role})
              </p>
              {event.location && (
                <p className="text-sm text-gray-500 mb-1">📍 Location: {event.location}</p>
              )}
              {event.txHash && (
                <p className="text-xs text-blue-500 truncate mt-2 border-t pt-2 border-gray-100">
                  Tx: {event.txHash}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;
