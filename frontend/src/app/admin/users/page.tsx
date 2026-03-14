'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { CustomersTab } from '@/components/admin/customers/customers-tab';

export default function AdminUsersPage() {
  return (
    <AdminLayout>
      <CustomersTab />
    </AdminLayout>
  );
}
