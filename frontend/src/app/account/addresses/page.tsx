'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Plus, Edit, Trash2, Star, ArrowLeft } from 'lucide-react';
import { useAddresses, useDeleteAddress, useSetDefaultAddress } from '@/lib/hooks/use-account';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Toast } from '@/components/ui/toast';

export default function AddressesPage() {
  const { data: addresses, isLoading } = useAddresses();
  const deleteAddress = useDeleteAddress();
  const setDefault = useSetDefaultAddress();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });

  const handleDelete = async (id: string) => {
    setDeleteConfirm({ show: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;

    try {
      await deleteAddress.mutateAsync(deleteConfirm.id);
      setToastMessage('Address deleted successfully');
      setShowToast(true);
      setDeleteConfirm({ show: false, id: null });
    } catch (error) {
      setToastMessage('Failed to delete address');
      setShowToast(true);
      setDeleteConfirm({ show: false, id: null });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefault.mutateAsync(id);
      setToastMessage('Default address updated');
      setShowToast(true);
    } catch (error) {
      setToastMessage('Failed to set default address');
      setShowToast(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {showToast && (
        <Toast message={toastMessage} onClose={() => setShowToast(false)} />
      )}

      <div className="container mx-auto px-4 py-8">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Account
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Delivery Addresses</h1>
          <Link
            href="/account/addresses/new"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Address
          </Link>
        </div>

        {!addresses || addresses.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="w-24 h-24 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No addresses saved</h2>
            <p className="text-muted-foreground mb-6">
              Add your first delivery address to get started
            </p>
            <Link
              href="/account/addresses/new"
              className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition"
            >
              Add Address
            </Link>
          </div>
        ) : (
          <div className="max-w-4xl grid md:grid-cols-2 gap-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="bg-card border rounded-lg p-6 relative"
              >
                {address.isDefault && (
                  <div className="absolute top-4 right-4">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  </div>
                )}

                <h3 className="font-bold text-lg mb-2">{address.label}</h3>
                <p className="text-sm mb-1">{address.line1}</p>
                {address.line2 && <p className="text-sm mb-1">{address.line2}</p>}
                <p className="text-sm mb-1">
                  {address.city}, {address.county}
                </p>
                <p className="text-sm font-semibold mb-3">{address.postcode}</p>

                {address.deliveryZone && (
                  <p className="text-xs text-primary mb-4">
                    {address.deliveryZone.name} - £{parseFloat(address.deliveryZone.deliveryFee).toFixed(2)} delivery
                  </p>
                )}

                <div className="flex gap-2">
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      disabled={setDefault.isPending}
                      className="flex-1 text-sm px-3 py-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition disabled:opacity-50"
                    >
                      Set Default
                    </button>
                  )}
                  <Link
                    href={`/account/addresses/${address.id}/edit`}
                    className="flex items-center justify-center gap-1 text-sm px-3 py-2 border rounded-lg hover:bg-muted transition"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(address.id)}
                    disabled={deleteAddress.isPending}
                    className="flex items-center justify-center gap-1 text-sm px-3 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/5 transition disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Address?"
        message="Are you sure you want to delete this address? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
