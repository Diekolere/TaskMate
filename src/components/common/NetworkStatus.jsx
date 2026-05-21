import React, { useState, useEffect } from 'react';

const NetworkStatus = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Periodically check just in case events are missed
        const interval = setInterval(() => {
            if (navigator.onLine === isOffline) {
                setIsOffline(!navigator.onLine);
            }
        }, 3000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, [isOffline]);

    if (!isOffline) return null;

    return (
        <div 
            style={{ zIndex: 9999999 }} 
            className="fixed top-0 left-0 right-0 w-full bg-red-500 text-white px-4 py-3 flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(239,68,68,0.4)] transition-all duration-300"
        >
            <span className="material-icons text-xl animate-pulse">cloud_off</span>
            <p className="text-sm font-extrabold tracking-wide">
                YOU ARE OFFLINE. <span className="font-medium ml-1">Please check your internet connection.</span>
            </p>
        </div>
    );
};

export default NetworkStatus;
