import React from 'react';
import { useAuth } from '../../context/AuthContext';
import CategorySelectionModal from './CategorySelectionModal';

/**
 * Wraps provider routes. If the provider hasn't selected their trade categories,
 * it overlays the CategorySelectionModal to enforce selection.
 */
export default function CategoryGate({ children }) {
    const { currentUser } = useAuth();

    // Only applies to providers
    const isProvider = currentUser?.role === 'provider';
    const hasCategories = currentUser?.tradeCategory && currentUser.tradeCategory.length > 0;

    if (!isProvider) {
        return <>{children}</>;
    }

    return (
        <>
            {/* Render the actual page behind (blurred/dimmed by the modal backdrop) */}
            {children}

            {/* If no categories, force them to select before interacting with the page */}
            <CategorySelectionModal open={!hasCategories} />
        </>
    );
}
