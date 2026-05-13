import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NetworkStatus = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {isOffline && (
                <motion.div
                    initial={{ y: -50 }}
                    animate={{ y: 0 }}
                    exit={{ y: -50 }}
                    className="fixed top-0 left-0 right-0 z-[10000] w-full"
                >
                    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-3 shadow-lg">
                        <span className="material-icons text-lg animate-pulse">cloud_off</span>
                        <p className="text-xs sm:text-sm font-bold tracking-wide">
                            YOU ARE OFFLINE. <span className="opacity-80 font-medium ml-1 hidden sm:inline">Please check your internet connection to continue.</span>
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NetworkStatus;
