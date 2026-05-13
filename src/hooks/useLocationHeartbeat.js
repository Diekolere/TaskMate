import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * Hook to periodically update the provider's live location in the database.
 * This enables "Uber-style" real-time proximity matching.
 */
export function useLocationHeartbeat(intervalMs = 300000) { // Default 5 minutes
    const { currentUser } = useAuth();
    const timerRef = useRef(null);

    const updateLocation = async () => {
        if (!currentUser || currentUser.role !== 'provider') return;

        // 1. Get current GPS
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const wkt = `POINT(${longitude} ${latitude})`;

            // 2. Update Supabase
            const { error } = await supabase
                .from('provider_profiles')
                .update({
                    location_coords: wkt,
                    last_seen_at: new Date().toISOString(),
                    is_online: true
                })
                .eq('id', currentUser.id);

            if (error) console.error('Heartbeat update failed:', error);
        }, (err) => {
            console.warn('Heartbeat: Could not get GPS', err);
        });
    };

    useEffect(() => {
        if (currentUser?.role === 'provider') {
            // Run immediately on mount
            updateLocation();

            // Set up interval
            timerRef.current = setInterval(updateLocation, intervalMs);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [currentUser, intervalMs]);

    return { refreshNow: updateLocation };
}
