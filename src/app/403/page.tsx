export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="text-[28px] font-bold">403 — Not allowed</h1>
      <p className="text-sm text-text-secondary">
        You don&apos;t have permission to view this page.
      </p>
    </div>
  );
}
