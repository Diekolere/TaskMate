import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Image moderation hook.
 * Converts a File to base64 and sends it to the `ai` Edge Function
 * with action: 'check-sensitivity'. Falls back to passing if the
 * Edge Function is unavailable (e.g. GEMINI_API_KEY not yet set).
 */
export default function useImageModeration() {
    const [checking, setChecking] = useState(false);
    const [result, setResult] = useState(null);

    const checkImage = useCallback(async (file) => {
        if (!file) return { passed: true };
        setChecking(true);
        setResult(null);

        try {
            // Convert file to base64 for transmission
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const { data, error } = await supabase.functions.invoke('ai', {
                body: {
                    action: 'check-image-sensitivity',
                    base64Image: base64,
                    mimeType: file.type,
                    fileName: file.name,
                }
            });

            if (error || !data?.success) {
                // Edge function not available yet (API key not set) — allow image through
                console.warn('Image moderation unavailable, allowing image:', error?.message);
                const outcome = { passed: true };
                setResult(outcome);
                setChecking(false);
                return outcome;
            }

            const outcome = {
                passed: data.is_safe,
                reason: data.reason || 'This image was flagged for inappropriate content.'
            };
            setResult(outcome);
            setChecking(false);
            return outcome;

        } catch (err) {
            // Network / unexpected error — allow through rather than block legitimate uploads
            console.error('Image moderation error:', err);
            const outcome = { passed: true };
            setResult(outcome);
            setChecking(false);
            return outcome;
        }
    }, []);

    const reset = useCallback(() => {
        setResult(null);
        setChecking(false);
    }, []);

    return { checkImage, checking, result, reset };
}
