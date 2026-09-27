/**
 * Lightweight Client-Side Privacy-First Telemetry & Analytics
 * Records feature adoption, tool usage, and client-side errors locally
 * without violating user privacy or requiring heavy third-party SDKs.
 */

export interface TelemetryEvent {
  name: string;
  payload?: Record<string, any>;
  timestamp: number;
}

const STORAGE_KEY = 'mesurv_telemetry_events';
const MAX_STORED_EVENTS = 200;

export function trackEvent(name: string, payload?: Record<string, any>): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const events: TelemetryEvent[] = raw ? JSON.parse(raw) : [];

    const newEvent: TelemetryEvent = {
      name,
      payload,
      timestamp: Date.now()
    };

    events.push(newEvent);

    // Keep only the most recent events to prevent localStorage saturation
    if (events.length > MAX_STORED_EVENTS) {
      events.splice(0, events.length - MAX_STORED_EVENTS);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));

    // Optional console telemetry in development
    if (typeof (import.meta as any) !== 'undefined' && (import.meta as any)?.env?.DEV) {
      console.debug(`[Telemetry] ${name}`, payload);
    }
  } catch (err) {
    // Fail silently to never disrupt user experience
  }
}

export function getTelemetrySummary(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const events: TelemetryEvent[] = JSON.parse(raw);
    return events.reduce((acc, evt) => {
      acc[evt.name] = (acc[evt.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  } catch {
    return {};
  }
}
