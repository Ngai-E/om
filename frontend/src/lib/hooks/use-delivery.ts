import { useQuery } from '@tanstack/react-query';
import { deliveryApi } from '@/lib/api/delivery';

export function useCheckPostcode(postcode: string) {
  return useQuery({
    queryKey: ['postcode', postcode],
    queryFn: () => deliveryApi.checkPostcode(postcode),
    enabled: postcode.length >= 5, // Only check when postcode is reasonable length
  });
}

export function useDeliveryZones() {
  return useQuery({
    queryKey: ['delivery-zones'],
    queryFn: () => deliveryApi.getZones(),
  });
}

export function useDeliverySlots(zoneId?: string, date?: string) {
  return useQuery({
    queryKey: ['delivery-slots', zoneId, date],
    queryFn: () => deliveryApi.getSlots(zoneId, date),
    enabled: !!zoneId,
  });
}
