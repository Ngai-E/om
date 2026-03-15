'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { promotionsApi } from '@/lib/api/promotions';
import { Tag, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import Link from 'next/link';

interface PromoCodeSelectorProps {
  selectedCode?: string;
  onSelectCode: (code: string) => void;
  onClearCode: () => void;
}

export function PromoCodeSelector({ selectedCode, onSelectCode, onClearCode }: PromoCodeSelectorProps) {
  const { isAuthenticated } = useAuthStore();
  const [showAvailable, setShowAvailable] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const { data: eligiblePromotions, isLoading } = useQuery({
    queryKey: ['eligible-promotions'],
    queryFn: promotionsApi.getEligiblePromotions,
    enabled: isAuthenticated,
  });

  const handleApplyManualCode = () => {
    if (manualCode.trim()) {
      onSelectCode(manualCode.trim().toUpperCase());
      setManualCode('');
    }
  };

  const getDiscountDisplay = (promo: any) => {
    if (promo.discountType === 'PERCENT') {
      return `${promo.discountValue}% OFF`;
    }
    return `£${promo.discountValue} OFF`;
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Tag className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Promo Code</h3>
      </div>

      {/* Manual Code Entry */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value.toUpperCase())}
          placeholder="Enter promo code"
          className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
          onKeyPress={(e) => e.key === 'Enter' && handleApplyManualCode()}
        />
        <button
          onClick={handleApplyManualCode}
          disabled={!manualCode.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          Apply
        </button>
      </div>

      {/* Selected Code Display */}
      {selectedCode && (
        <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-green-600" />
            <span className="font-mono font-bold text-green-800">{selectedCode}</span>
            <span className="text-sm text-green-700">applied</span>
          </div>
          <button
            onClick={onClearCode}
            className="text-sm text-green-700 hover:text-green-900 underline"
          >
            Remove
          </button>
        </div>
      )}

      {/* Available Codes for Logged-in Users */}
      {isAuthenticated && eligiblePromotions && eligiblePromotions.length > 0 && (
        <div>
          <button
            onClick={() => setShowAvailable(!showAvailable)}
            className="w-full flex items-center justify-between text-sm text-blue-700 hover:text-blue-900 font-medium mb-2"
          >
            <span className="flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              You have {eligiblePromotions.length} available {eligiblePromotions.length === 1 ? 'code' : 'codes'}!
            </span>
            {showAvailable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAvailable && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {eligiblePromotions.map((promo: any) => (
                <button
                  key={promo.id}
                  onClick={() => {
                    if (promo.code) {
                      onSelectCode(promo.code);
                      setShowAvailable(false);
                    }
                  }}
                  disabled={selectedCode === promo.code}
                  className={`w-full text-left p-3 rounded-lg border-2 transition ${
                    selectedCode === promo.code
                      ? 'bg-green-50 border-green-300'
                      : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{promo.name}</div>
                      {promo.description && (
                        <div className="text-xs text-gray-600 mt-1 line-clamp-2">{promo.description}</div>
                      )}
                      {promo.code && (
                        <div className="font-mono text-sm font-bold text-blue-700 mt-1">{promo.code}</div>
                      )}
                      {promo.minSubtotal && (
                        <div className="text-xs text-gray-500 mt-1">Min order: £{promo.minSubtotal}</div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-block px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                        {getDiscountDisplay(promo)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Guest Message */}
      {!isAuthenticated && (
        <div className="text-xs text-gray-600 mt-2 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <span>
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>{' '}
            to see your available promo codes
          </span>
        </div>
      )}
    </div>
  );
}
