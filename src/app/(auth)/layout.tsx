export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-100 antialiased selection:bg-sky-500/30 selection:text-sky-200">
      {children}
    </div>
  );
}
