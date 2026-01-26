// /frontend/src/core/auth/activityTracker.js

const ACTIVITY_KEY = 'last_activity';
const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Update the last activity timestamp
 */
export function updateActivity() {
  localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
}

/**
 * Get the last activity timestamp
 */
export function getLastActivity() {
  const stored = localStorage.getItem(ACTIVITY_KEY);
  return stored ? parseInt(stored, 10) : null;
}

/**
 * Check if user has been inactive for longer than the timeout
 */
export function isInactive() {
  const lastActivity = getLastActivity();
  if (!lastActivity) return false; // No activity recorded yet

  const timeSinceActivity = Date.now() - lastActivity;
  return timeSinceActivity >= INACTIVITY_TIMEOUT;
}

/**
 * Get time remaining until session expires due to inactivity (in ms)
 */
export function getTimeUntilExpiry() {
  const lastActivity = getLastActivity();
  if (!lastActivity) return INACTIVITY_TIMEOUT;

  const elapsed = Date.now() - lastActivity;
  return Math.max(0, INACTIVITY_TIMEOUT - elapsed);
}

/**
 * Clear activity tracking (on logout)
 */
export function clearActivity() {
  localStorage.removeItem(ACTIVITY_KEY);
}

/**
 * Initialize activity listeners on user-interaction events
 * Returns cleanup function
 */
export function initActivityListeners() {
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

  // Throttle to avoid excessive updates
  let lastUpdate = 0;
  const THROTTLE_MS = 30000; // Update at most every 30 seconds

  const handleActivity = () => {
    const now = Date.now();
    if (now - lastUpdate >= THROTTLE_MS) {
      lastUpdate = now;
      updateActivity();
    }
  };

  events.forEach(event => {
    window.addEventListener(event, handleActivity, { passive: true });
  });

  // Initial activity update
  updateActivity();

  // Return cleanup function
  return () => {
    events.forEach(event => {
      window.removeEventListener(event, handleActivity);
    });
  };
}
