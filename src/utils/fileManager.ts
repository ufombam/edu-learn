import api from '../lib/api';

export interface FileUploadOptions {
  bucket: string;
  folder: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

export async function uploadFile(
  file: File,
  options: FileUploadOptions
): Promise<{ url: string; path: string } | { error: string }> {
  const maxSize = (options.maxSizeMB || 10) * 1024 * 1024;

  if (file.size > maxSize) {
    return { error: `File size exceeds ${options.maxSizeMB || 10}MB limit` };
  }

  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    return { error: 'File type not allowed' };
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', options.bucket);
    formData.append('folder', options.folder);

    // Assuming a backend endpoint for uploads exists
    const { data } = await api.post('/storage/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return {
      url: data.url,
      path: data.path
    };
  } catch (error) {
    console.error('Upload failed:', error);
    return { error: 'Upload failed' };
  }
}

export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  try {
    await api.delete(`/storage/${bucket}/${path}`);
    return true;
  } catch (error) {
    return false;
  }
}

export function compressImage(file: File, maxWidth: number = 1200): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Compression failed'));
            }
          },
          'image/jpeg',
          0.8
        );
      };

      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function validateFile(file: File, options: {
  maxSizeMB?: number;
  allowedTypes?: string[];
}): { valid: boolean; error?: string } {
  if (options.maxSizeMB && file.size > options.maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      error: `File size exceeds ${options.maxSizeMB}MB limit`
    };
  }

  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not allowed'
    };
  }

  return { valid: true };
}

export async function downloadForOffline(
  contentId: string,
  contentType: 'course' | 'lesson' | 'resource',
  userId: string
): Promise<boolean> {
  try {
    await api.post('/offline-content', {
      user_id: userId,
      content_type: contentType,
      content_id: contentId,
      downloaded_at: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error marking content as offline:', error);
    return false;
  }
}

export async function syncOfflineData(userId: string): Promise<void> {
  try {
    await api.post('/sync/offline-data', { userId });
  } catch (error) {
    console.error('Error syncing offline data:', error);
  }
}
