import { useEffect, useRef, useState, ReactNode, ComponentType } from 'react';

interface LazySectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
}

export function LazySection({
  children,
  fallback = <div className="min-h-[200px]" />,
  rootMargin = '100px',
  threshold = 0.1,
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  );
}

// Higher-order component for lazy loading entire components
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  fallback?: ReactNode
) {
  return function LazyComponent(props: P) {
    return (
      <LazySection fallback={fallback}>
        <Component {...props} />
      </LazySection>
    );
  };
}
