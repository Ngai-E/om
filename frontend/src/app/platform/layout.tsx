// Minimal pass-through layout for /platform routes.
// Auth + sidebar is handled by /platform/(console)/layout.tsx
// /platform/signup is public and renders without auth.
export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
