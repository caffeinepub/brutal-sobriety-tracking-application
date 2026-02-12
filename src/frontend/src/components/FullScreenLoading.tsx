export default function FullScreenLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-sm border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="text-muted-foreground font-bold uppercase tracking-wider">Loading...</p>
      </div>
    </div>
  );
}
