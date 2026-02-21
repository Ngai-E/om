export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            OMEGA
          </h1>
          <p className="text-sm text-muted-foreground">
            Afro Caribbean Superstore
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
