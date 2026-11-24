export function LoadingScreen({ message }: { message: string }) {
  return (
    <main className="loading-screen" aria-busy="true">
      <div className="loading-indicator" role="status" aria-live="polite">
        <span className="loader" aria-hidden="true" />
        <span>{message}</span>
      </div>
    </main>
  );
}
