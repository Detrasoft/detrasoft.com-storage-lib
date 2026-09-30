export interface FileStorage {
  id?: string;
  name?: string;
  originalName?: string;
  url?: string;
  groupingKey?: string;
  status?: string;
  type?: string;
  contentType?: string;
  size?: number;
  folder?: string;
  fileId?: string;
  createdAt?: string;
  previewStatus?: 'PENDING' | 'PROCESSING' | 'READY' | 'UNSUPPORTED' | 'ERROR';
  previewable?: boolean;
}
