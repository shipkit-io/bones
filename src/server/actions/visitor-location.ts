"use server";

import { EventEmitter } from "events";

// Create a global event emitter for visitor locations
const visitorEvents = new EventEmitter();

export interface VisitorLocation {
    lat: number;
    lng: number;
    timestamp: number;
}

export interface Arc {
    order: number;
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    arcAlt: number;
    color: string;
}

// Store recent visitor locations (last 100)
const recentVisitors: VisitorLocation[] = [];
const MAX_RECENT_VISITORS = 100;

export async function recordVisitorLocation(location: VisitorLocation) {
    try {
        // Add to recent visitors
        recentVisitors.unshift(location);
        if (recentVisitors.length > MAX_RECENT_VISITORS) {
            recentVisitors.pop();
        }

        // Emit the event
        await Promise.resolve(visitorEvents.emit("newVisitor", location));

        return { success: true };
    } catch (error) {
        console.error("Error recording visitor location:", error);
        return { success: false, error: "Failed to record visitor location" };
    }
}

export async function getRecentVisitors(): Promise<VisitorLocation[]> {
    try {
        return await Promise.resolve([...recentVisitors]);
    } catch (error) {
        console.error("Error getting recent visitors:", error);
        return [];
    }
}

export async function subscribeToVisitors(
    callback: (location: VisitorLocation) => void,
): Promise<() => void> {
    await Promise.resolve(visitorEvents.on("newVisitor", callback));
    return () => {
        visitorEvents.off("newVisitor", callback);
    };
}
