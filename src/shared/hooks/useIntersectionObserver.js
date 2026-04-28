import { useEffect, useRef, useCallback } from 'react';

export const useIntersectionObserver = (onIntersect, options = {}) => {
  const observerRef = useRef(null);
  const targetRef = useRef(null);

  const {
    threshold = 0.5,
    rootMargin = '0px',
    enabled = true,
  } = options;

  const callback = useCallback(
    (entries) => {
      if (entries[0].isIntersecting && enabled) {
        onIntersect();
      }
    },
    [onIntersect, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    observerRef.current = new IntersectionObserver(callback, {
      threshold,
      rootMargin,
    });

    if (targetRef.current) {
      observerRef.current.observe(targetRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback, threshold, rootMargin, enabled]);

  return targetRef;
};