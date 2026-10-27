export const VIDEO_MAX_BYTES = 10 * 1024 ** 3;
export const IMAGE_MAX_BYTES = 10 * 1024 ** 2;
export const VIDEO_LIMIT_LABEL = '10 GB';
export function checkUpload(file: { name: string; size: number; type: string }, field: 'image' | 'video') {
  if (!file.size) throw new Error('This file is empty. Choose a finished export.');
  const limit = field === 'video' ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
  if (file.size > limit) throw new Error(`${field === 'video' ? 'Videos' : 'Images'} must be ${field === 'video' ? VIDEO_LIMIT_LABEL : '10 MB'} or smaller. Your recipe has not changed.`);
  if (field === 'video') {
    if (!/\.mp4$/i.test(file.name) || (file.type && file.type !== 'video/mp4')) throw new Error('Choose a finished MP4 video.');
    return { ext: 'mp4', contentType: 'video/mp4' };
  }
  const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as Record<string,string>)[file.type];
  if (!ext) throw new Error('Choose a JPG, PNG or WebP photo.');
  return { ext, contentType: file.type };
}
export function formatBytes(bytes: number) {
  return bytes >= 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(2)} GB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}
