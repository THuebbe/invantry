// Backward-compat redirect: /orders/receive-po → /receiving/new

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function RedirectToReceiving({ poId }) {
	const navigate = useNavigate();

	useEffect(() => {
		const path = poId ? `/receiving/new?poId=${poId}` : "/receiving/new";
		navigate(path, { replace: true });
	}, [poId, navigate]);

	return null;
}
