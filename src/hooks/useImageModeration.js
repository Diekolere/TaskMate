import { useState, useCallback } from 'react';

// Simulated image moderation hook
// In production: replace checkImage body with a real Sightengine / Google Vision call
// e.g. POST https://api.sightengine.com/1.0/check.json

const BLOCKED_KEYWORDS = ['nsfw', 'adult', 'explicit', 'nude', 'test_fail'];

export default function useImageModeration() {
    const [checking, setChecking] = useState(false);
    const [result, setResult] = useState(null); // null | { passed: bool, reason: string }

    const checkImage = useCallback(async (file) => {
        if (!file) return { passed: true };
        setChecking(true);
        setResult(null);

        // Simulate network latency
        await new Promise(r => setTimeout(r, 1400));

        // Simulate failure for files with flagged names (for demo purposes)
        const nameLower = file.name.toLowerCase();
        const flagged = BLOCKED_KEYWORDS.some(kw => nameLower.includes(kw));

        // ~5% random failure rate to simulate real moderation
        const randomFail = Math.random() < 0.05;

        const passed = !flagged && !randomFail;
        const reason = passed ? null : flagged
            ? 'This image was flagged for inappropriate content.'
            : 'This image did not pass our content safety check.';

        const outcome = { passed, reason };
        setResult(outcome);
        setChecking(false);
        return outcome;
    }, []);

    const reset = useCallback(() => {
        setResult(null);
        setChecking(false);
    }, []);

    return { checkImage, checking, result, reset };
}
