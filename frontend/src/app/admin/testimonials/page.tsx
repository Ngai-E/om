'use client';

import { useState } from 'react';
import { Upload, Trash2, Eye, EyeOff, Video } from 'lucide-react';
import { useTestimonials, useCreateTestimonial, useUpdateTestimonial, useToggleTestimonialActive, useDeleteTestimonial } from '@/lib/hooks/use-testimonials';
import apiClient from '@/lib/api/client';

const toast = {
  success: (msg: string) => alert(msg),
  error: (msg: string) => alert(msg),
};

export default function TestimonialsPage() {
  const { data: testimonials, isLoading } = useTestimonials();
  const createTestimonial = useCreateTestimonial();
  const updateTestimonial = useUpdateTestimonial();
  const toggleActive = useToggleTestimonialActive();
  const deleteTestimonial = useDeleteTestimonial();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sortOrder: 0,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 20MB');
      return;
    }

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload mp4, webm, ogg, mov, or avi');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a video file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload video
      const formDataUpload = new FormData();
      formDataUpload.append('video', selectedFile);

      const { data: uploadResult } = await apiClient.post('/upload/testimonial-video', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(progress);
        },
      });

      // Create testimonial record
      await createTestimonial.mutateAsync({
        videoUrl: uploadResult.url,
        title: formData.title || undefined,
        description: formData.description || undefined,
        sortOrder: formData.sortOrder,
      });

      toast.success('Video uploaded successfully!');
      
      // Reset form
      setSelectedFile(null);
      setFormData({ title: '', description: '', sortOrder: 0 });
      setUploadProgress(0);
      
      // Reset file input
      const fileInput = document.getElementById('video-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload video');
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await toggleActive.mutateAsync(id);
      toast.success('Testimonial status updated');
    } catch (error) {
      toast.error('Failed to update testimonial');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;

    try {
      await deleteTestimonial.mutateAsync(id);
      toast.success('Testimonial deleted');
    } catch (error) {
      toast.error('Failed to delete testimonial');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Testimonials</h1>
        <p className="text-gray-600">Upload and manage customer testimonial videos for the homepage</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Upload New Video</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Video File (Max 20MB)</label>
            <div className="flex items-center gap-4">
              <label className="flex-1 cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-green-500 transition text-center">
                  <Video className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {selectedFile ? selectedFile.name : 'Click to select video file'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">MP4, WebM, OGG, MOV, AVI (max 20MB)</p>
                </div>
                <input
                  id="video-upload"
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
            {selectedFile && (
              <p className="text-sm text-green-600 mt-2">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
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

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload Video'}
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
    </div>
  );
}
