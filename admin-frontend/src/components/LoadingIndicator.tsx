export function LoadingSpinner() {
  return <span className="loader" aria-hidden="true" />;
}

export function LoadingIndicator({
  message,
  className = "",
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={`loading-indicator ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner />
      <span>{message}</span>
    </div>
  );
}

export function LoadingScreen({ message }: { message: string }) {
  return (
    <main className="loading-screen" aria-busy="true">
      <LoadingIndicator message={message} />
    </main>
  );
}
