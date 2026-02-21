'use client';

import { useAuthStore } from '@/lib/store/auth-store';
import { AdminLayout } from '@/components/admin/admin-layout';
import { StaffLayout } from '@/components/staff/staff-layout';

interface RoleBasedLayoutProps {
  children: React.ReactNode;
}

export function RoleBasedLayout({ children }: RoleBasedLayoutProps) {
  const { user } = useAuthStore();

  // Admin users see AdminLayout
  if (user?.role === 'ADMIN') {
    return <AdminLayout>{children}</AdminLayout>;
  }

  // Staff users see StaffLayout
  if (user?.role === 'STAFF') {
    return <StaffLayout>{children}</StaffLayout>;
  }

  // Default to StaffLayout for backward compatibility
  return <StaffLayout>{children}</StaffLayout>;
}
