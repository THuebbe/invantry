// src/services/analytics.js

export function trackEvent(eventName, properties = {}) {
	// For now, just console.log
	// Later you can integrate with Google Analytics, Mixpanel, etc.
	console.log("📊 Event:", eventName, properties);

	// Example integration:
	// if (window.gtag) {
	//   window.gtag('event', eventName, properties);
	// }
}

export function trackFunnelStep(step, additionalData = {}) {
	trackEvent("funnel_progression", {
		step,
		timestamp: new Date().toISOString(),
		...additionalData,
	});
}
