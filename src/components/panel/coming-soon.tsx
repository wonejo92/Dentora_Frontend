export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="w-full">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">{title}</h1>
      <div className="rounded-3xl bg-surface px-6 py-14 text-center">
        <p className="font-semibold">Esta sección llega en la siguiente fase</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">{description}</p>
      </div>
    </div>
  );
}
