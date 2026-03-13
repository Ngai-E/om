'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { deliveryApi } from '@/lib/api/delivery';

interface DeliverySlotPickerProps {
  onSlotSelect: (slot: any) => void;
  selectedSlotId?: string;
  minHoursAhead?: number;
}

export function DeliverySlotPicker({ onSlotSelect, selectedSlotId, minHoursAhead = 24 }: DeliverySlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  // Generate available dates (next 7 days, respecting minimum hours)
  useEffect(() => {
    const dates: string[] = [];
    const now = new Date();
    const minDate = new Date(now.getTime() + minHoursAhead * 60 * 60 * 1000);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(minDate);
      date.setDate(minDate.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    setAvailableDates(dates);
    setSelectedDate(dates[0]); // Auto-select first available date
  }, [minHoursAhead]);

  // Fetch slots for selected date
  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['available-slots', selectedDate],
    queryFn: () => deliveryApi.getAvailableSlots(selectedDate),
    enabled: !!selectedDate,
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  return (
    <div className="space-y-4">
      {/* Date Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Select Delivery Date
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {availableDates.map((date) => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`p-2 text-sm border-2 rounded-lg transition ${
                selectedDate === date
                  ? 'border-green-600 bg-green-50 text-green-900 font-semibold'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              {formatDate(date)}
            </button>
          ))}
        </div>
      </div>

      {/* Time Slot Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Select Time Slot
        </label>
        
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading slots...</div>
        ) : slots.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 font-medium">No slots available for this date</p>
            <p className="text-sm text-gray-400 mt-1">Please select another date</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {slots.map((slot: any) => {
              const slotsLeft = slot.capacity - (slot.currentOrders || 0);
              const isLowCapacity = slotsLeft <= 3 && slotsLeft > 0;
              const isAvailable = slot.available !== false && slotsLeft > 0;
              
              return (
                <button
                  key={slot.id}
                  onClick={() => isAvailable && onSlotSelect({ ...slot, date: selectedDate })}
                  disabled={!isAvailable}
                  className={`p-3 border-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedSlotId === slot.id
                      ? 'border-green-600 bg-green-50'
                      : !isAvailable
                      ? 'border-red-200 bg-red-50'
                      : isLowCapacity
                      ? 'border-orange-200 bg-orange-50 hover:border-orange-400'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <p className="font-semibold text-sm">
                    {slot.startTime} - {slot.endTime}
                  </p>
                  {!isAvailable ? (
                    <p className="text-xs text-red-600 font-medium mt-1">Fully Booked</p>
                  ) : isLowCapacity ? (
                    <p className="text-xs text-orange-600 font-medium mt-1">
                      Only {slotsLeft} left!
                    </p>
                  ) : (
                    <p className="text-xs text-green-600 mt-1">
                      {slotsLeft} available
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          <span className="font-semibold">📦 Delivery Info:</span> Orders must be placed at least {minHoursAhead} hours before delivery.
        </p>
      </div>
    </div>
  );
}
