'use client';

import { useState } from 'react';
import { Plus, Trash2, Eye, EyeOff, Video } from 'lucide-react';
import { useTestimonials, useCreateTestimonial, useToggleTestimonialActive, useDeleteTestimonial } from '@/lib/hooks/use-testimonials';
import { AdminLayout } from '@/components/admin/admin-layout';

export default function TestimonialsPage() {
  const { data: testimonials, isLoading } = useTestimonials();
  const createTestimonial = useCreateTestimonial();
  const toggleActive = useToggleTestimonialActive();
  const deleteTestimonial = useDeleteTestimonial();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formData, setFormData] = useState({
    videoUrl: '',
    thumbnailUrl: '',
    title: '',
    description: '',
    sortOrder: 0,
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = async () => {
    if (!formData.videoUrl.trim()) {
      showNotification('error', 'Please enter a video URL');
      return;
    }

    setIsSubmitting(true);

    try {
      await createTestimonial.mutateAsync({
        videoUrl: formData.videoUrl,
        thumbnailUrl: formData.thumbnailUrl || undefined,
        title: formData.title || undefined,
        description: formData.description || undefined,
        sortOrder: formData.sortOrder,
      });

      showNotification('success', 'Testimonial added successfully!');
      
      // Reset form
      setFormData({ videoUrl: '', thumbnailUrl: '', title: '', description: '', sortOrder: 0 });
    } catch (error: any) {
      console.error('Submit error:', error);
      showNotification('error', error.response?.data?.message || 'Failed to add testimonial');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await toggleActive.mutateAsync(id);
      showNotification('success', 'Testimonial status updated');
    } catch (error) {
      showNotification('error', 'Failed to update testimonial');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;

    try {
      await deleteTestimonial.mutateAsync(id);
      showNotification('success', 'Testimonial deleted');
    } catch (error) {
      showNotification('error', 'Failed to delete testimonial');
    }
  };

  return (
    <AdminLayout>
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white font-medium animate-slide-in`}>
          {notification.message}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Testimonials</h1>
        <p className="text-gray-600">Add and manage customer testimonial videos for the homepage</p>
      </div>

      {/* Add New Testimonial */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Add New Testimonial</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Video URL *</label>
            <input
              type="url"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              placeholder="https://example.com/video.mp4 or YouTube/Vimeo embed URL"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">Direct link to video file or embed URL from YouTube/Vimeo</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Thumbnail URL (Optional)</label>
            <input
              type="url"
              value={formData.thumbnailUrl}
              onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
              placeholder="https://example.com/thumbnail.jpg"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">Optional thumbnail image for the video</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Title (Optional)</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Happy Customer Review"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description (Optional)</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the testimonial"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Sort Order</label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              className="w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!formData.videoUrl.trim() || isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {isSubmitting ? 'Adding...' : 'Add Testimonial'}
          </button>
        </div>
      </div>

      {/* Testimonials List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Existing Testimonials</h2>

        {isLoading ? (
          <p className="text-gray-600">Loading testimonials...</p>
        ) : testimonials && testimonials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="border rounded-lg overflow-hidden">
                <div className="relative aspect-video bg-gray-900">
                  <video
                    src={testimonial.videoUrl}
                    poster={testimonial.thumbnailUrl || undefined}
                    className="w-full h-full object-cover"
                    controls
                  />
                </div>
                <div className="p-4">
                  {testimonial.title && (
                    <h3 className="font-semibold text-gray-900 mb-1">{testimonial.title}</h3>
                  )}
                  {testimonial.description && (
                    <p className="text-sm text-gray-600 mb-3">{testimonial.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>Order: {testimonial.sortOrder}</span>
                    <span className={`px-2 py-1 rounded ${testimonial.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {testimonial.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(testimonial.id)}
                      className="flex-1 px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      {testimonial.isActive ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Show
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(testimonial.id)}
                      className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Video className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No testimonials yet. Upload your first video above!</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
