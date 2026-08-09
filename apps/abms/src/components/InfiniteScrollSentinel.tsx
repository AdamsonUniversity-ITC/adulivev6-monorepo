import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface InfiniteScrollSentinelProps {
    hasMore: boolean;
    loading: boolean;
    onLoadMore: () => boolean | Promise<boolean>;
    root?: Element | null;
    rootMargin?: string;
    loadingLabel?: string;
    retryLabel?: string;
    className?: string;
}

export function InfiniteScrollSentinel({
    hasMore,
    loading,
    onLoadMore,
    root = null,
    rootMargin = '320px 0px',
    loadingLabel = 'Loading more…',
    retryLabel = 'Could not load more. Retry',
    className,
}: InfiniteScrollSentinelProps) {
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const attemptedRef = useRef(false);
    const requestInFlightRef = useRef(false);
    const onLoadMoreRef = useRef(onLoadMore);
    const [failed, setFailed] = useState(false);

    onLoadMoreRef.current = onLoadMore;

    const requestNextPage = useCallback(async (retry = false) => {
        if (!hasMore || loading || requestInFlightRef.current) return;
        if (attemptedRef.current && !retry) return;

        attemptedRef.current = true;
        requestInFlightRef.current = true;
        if (retry) setFailed(false);

        try {
            const succeeded = await onLoadMoreRef.current();
            if (!succeeded) setFailed(true);
        } catch {
            setFailed(true);
        } finally {
            requestInFlightRef.current = false;
        }
    }, [hasMore, loading]);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !hasMore || loading || failed || attemptedRef.current) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries.some(entry => entry.isIntersecting)) {
                    void requestNextPage();
                }
            },
            { root, rootMargin, threshold: 0 },
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [failed, hasMore, loading, requestNextPage, root, rootMargin]);

    if (!hasMore && !loading) return null;

    return (
        <div
            ref={sentinelRef}
            className={className}
            aria-live="polite"
            style={{
                minHeight: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 12,
            }}
        >
            {loading && (
                <>
                    <Loader2 aria-hidden="true" style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                    <span>{loadingLabel}</span>
                </>
            )}
            {failed && !loading && (
                <button
                    type="button"
                    onClick={() => void requestNextPage(true)}
                    style={{
                        border: 0,
                        background: 'transparent',
                        color: 'inherit',
                        cursor: 'pointer',
                        font: 'inherit',
                        fontWeight: 700,
                        textDecoration: 'underline',
                        textUnderlineOffset: 3,
                    }}
                >
                    {retryLabel}
                </button>
            )}
            {!loading && !failed && <span className="sr-only">More records load automatically while scrolling.</span>}
        </div>
    );
}
