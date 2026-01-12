import { useQuery } from '@tanstack/react-query';
import {
  fetchPaymentTerms,
  fetchPaymentTerm
} from '../services/paymentTermsService';

/**
 * Get all payment terms (platform-wide reference data)
 * @returns {Object} Query result with payment terms data
 */
export function usePaymentTerms() {
  return useQuery({
    queryKey: ['payment-terms'],
    queryFn: fetchPaymentTerms,
    staleTime: 1000 * 60 * 60, // Fresh for 1 hour (reference data changes rarely)
  });
}

/**
 * Get payment term by ID
 * @param {string} termId - Payment term UUID
 * @returns {Object} Query result with payment term data
 */
export function usePaymentTerm(termId) {
  return useQuery({
    queryKey: ['payment-term', termId],
    queryFn: () => fetchPaymentTerm(termId),
    enabled: !!termId,
    staleTime: 1000 * 60 * 60, // Fresh for 1 hour
  });
}
