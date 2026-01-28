// frontend/src/hooks/usePOSImport.js

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	savePOSCredentials,
	verifyPOSConnection,
	getPOSImportPreview,
	importMenuFromPOS,
	getSquareLocations,
} from "../services/posImportService";

/**
 * Verify POS connection
 */
export function usePOSVerify() {
	return useMutation({
		mutationFn: ({ posSystem }) => verifyPOSConnection(posSystem),
	});
}

/**
 * Save POS credentials
 */
export function usePOSSaveCredentials() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ posSystem, credentials }) =>
			savePOSCredentials(posSystem, credentials),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["pos-connection"] });
		},
	});
}

/**
 * Get POS import preview
 */
export function usePOSImportPreview(posSystem, enabled = true) {
	return useQuery({
		queryKey: ["pos-import-preview", posSystem],
		queryFn: () => getPOSImportPreview(posSystem),
		enabled: !!posSystem && enabled,
		staleTime: 1000 * 60 * 5, // Fresh for 5 minutes
	});
}

/**
 * Execute POS menu import
 */
export function usePOSImport() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ posSystem, options }) => importMenuFromPOS(posSystem, options),
		onSuccess: () => {
			// Invalidate menu items since we just imported new ones
			queryClient.invalidateQueries({ queryKey: ["menu-items"] });
			queryClient.invalidateQueries({ queryKey: ["pos-import-preview"] });
		},
	});
}

/**
 * Get Square locations for setup
 */
export function useSquareLocations(accessToken) {
	return useQuery({
		queryKey: ["square-locations", accessToken],
		queryFn: () => getSquareLocations(accessToken),
		enabled: !!accessToken,
		staleTime: 1000 * 60 * 10, // Fresh for 10 minutes
	});
}
