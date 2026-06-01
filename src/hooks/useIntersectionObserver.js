import { useEffect, useRef, useCallback } from 'react';

/**
 * A hook that detects when an element intersects the viewport.
 * 
 * @param {Function} onIntersect - Callback to run when the element is visible.
 * @param {boolean} [enabled=true] - Whether the observer is active (useful to pause when loading or when no more data).
 * @param {Object} [options] - IntersectionObserver options (root, rootMargin, threshold).
 * @returns {React.RefObject} - A ref to attach to the target DOM element (e.g. a loading spinner at the bottom).
 */
export function useIntersectionObserver(onIntersect, enabled = true, options = { rootMargin: '200px' }) {
    const targetRef = useRef(null);

    const handleIntersect = useCallback(
        (entries) => {
            const [entry] = entries;
            if (entry.isIntersecting && enabled) {
                onIntersect();
            }
        },
        [onIntersect, enabled]
    );

    useEffect(() => {
        const target = targetRef.current;
        if (!target) return;

        const observer = new IntersectionObserver(handleIntersect, options);
        observer.observe(target);

        return () => {
            if (target) {
                observer.unobserve(target);
            }
        };
    }, [handleIntersect, options]);

    return targetRef;
}
