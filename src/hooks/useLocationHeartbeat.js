import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * Hook to periodically update the user's live location in the database.
 * - Providers: Frequent updates (5m) for real-time discovery.
 * - Customers: Occasional updates (30m) for relevant feed recommendations.
 */
export function useLocationHeartbeat(customInterval = null) {
    const { currentUser } = useAuth();
    const timerRef = useRef(null);

    // Providers update every 5m, Customers every 30m
    const intervalMs = customInterval || (currentUser?.role === 'provider' ? 300000 : 1800000);

    const updateLocation = async () => {
        if (!currentUser) return;

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const wkt = `POINT(${longitude} ${latitude})`;

            // 1. Update base profile (for all users)
            await supabase
                .from('profiles')
                .update({
                    location_coords: wkt,
                    last_seen_at: new Date().toISOString()
                })
                .eq('id', currentUser.id);

            // 2. Update provider-specific table if applicable
            if (currentUser.role === 'provider') {
                await supabase
                    .from('provider_profiles')
                    .update({
                        location_coords: wkt,
                        last_seen_at: new Date().toISOString(),
                        is_online: true
                    })
                    .eq('id', currentUser.id);
            }
        }, (err) => {
            console.warn('Heartbeat: Could not get GPS', err);
        });
    };

    useEffect(() => {
        if (currentUser) {
            updateLocation();
            timerRef.current = setInterval(updateLocation, intervalMs);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [currentUser, intervalMs]);

    return { refreshNow: updateLocation };
}
