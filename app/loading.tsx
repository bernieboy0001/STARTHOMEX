export default function Loading() {
  return (
    <main className="page-loader" aria-live="polite" aria-label="Loading HOMEX">
      <div className="page-loader-mark">
        <img src="/homex-logo.png" alt="" />
      </div>
      <span>Loading your care circle</span>
    </main>
  );
}
