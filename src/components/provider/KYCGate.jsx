import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import KYCRequiredModal from './KYCRequiredModal';
import KYCModal from './KYCModal';

/**
 * Wraps a provider feature page. If KYC is not completed,
 * it renders the page underneath with the KYCRequiredModal overlaid.
 * When the user clicks "Start Verification", it opens the full KYCModal.
 * 
 * Usage: <KYCGate><YourPage /></KYCGate>
 */
export default function KYCGate({ children }) {
    const { currentUser } = useAuth();
    const [kycModalOpen, setKycModalOpen] = useState(false);

    // Only applies to providers. If not a provider, or KYC is done, just render children.
    const isProvider = currentUser?.role === 'provider';
    const kycDone = currentUser?.kycCompleted === true;

    if (!isProvider || kycDone) {
        return <>{children}</>;
    }

    return (
        <>
            {/* Render the actual page behind (blurred/dimmed by the modal backdrop) */}
            {children}

            {/* KYC Required prompt */}
            <KYCRequiredModal
                open={!kycModalOpen}
                onStartKYC={() => setKycModalOpen(true)}
            />

            {/* Full KYC completion flow */}
            <KYCModal
                open={kycModalOpen}
                onClose={() => setKycModalOpen(false)}
                onComplete={() => setKycModalOpen(false)}
            />
        </>
    );
}
