'use client';

import { Users } from 'lucide-react';

export function DriversTab() {
  return (
    <div className="text-center py-16">
      <div className="max-w-md mx-auto">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-10 h-10 text-orange-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Drivers Management
        </h3>
        <p className="text-gray-600 mb-4">
          Coming soon! Driver management features will be available in a future update.
        </p>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left">
          <p className="text-sm font-medium text-orange-900 mb-2">Planned Features:</p>
          <ul className="text-sm text-orange-800 space-y-1">
            <li>• Add and manage drivers</li>
            <li>• Assign drivers to delivery zones</li>
            <li>• Track driver availability</li>
            <li>• View driver performance metrics</li>
            <li>• Manage driver schedules</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
