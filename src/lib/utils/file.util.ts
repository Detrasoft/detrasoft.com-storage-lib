/**
 * Formata bytes em uma string legível (KB, MB, GB...).
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Retorna o ícone FontAwesome adequado ao tipo de arquivo.
 */
export function getFileIcon(filename?: string): string {
  if (!filename) return 'fa-solid fa-file';
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'fa-solid fa-file-pdf';
    case 'doc':
    case 'docx': return 'fa-solid fa-file-word';
    case 'xls':
    case 'xlsx': return 'fa-solid fa-file-excel';
    case 'ppt':
    case 'pptx': return 'fa-solid fa-file-powerpoint';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
    case 'webp':
    case 'gif': return 'fa-solid fa-file-image';
    case 'zip':
    case 'rar':
    case '7z': return 'fa-solid fa-file-zipper';
    case 'txt':
    case 'md': return 'fa-solid fa-file-lines';
    case 'mp4':
    case 'avi':
    case 'mov': return 'fa-solid fa-file-video';
    case 'mp3':
    case 'wav': return 'fa-solid fa-file-audio';
    case 'json':
    case 'js':
    case 'ts':
    case 'html':
    case 'css': return 'fa-solid fa-file-code';
    default: return 'fa-solid fa-file';
  }
}

/**
 * Retorna uma cor temática por extensão de arquivo.
 */
export function getFileColor(filename?: string): string {
  if (!filename) return '#6b7280';
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return '#ef4444';
    case 'doc':
    case 'docx': return '#3b82f6';
    case 'xls':
    case 'xlsx': return '#10b981';
    case 'ppt':
    case 'pptx': return '#f59e0b';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
    case 'webp':
    case 'gif': return '#ec4899';
    case 'zip':
    case 'rar':
    case '7z': return '#8b5cf6';
    case 'txt':
    case 'md': return '#64748b';
    case 'mp4':
    case 'avi':
    case 'mov': return '#14b8a6';
    default: return '#6b7280';
  }
}
