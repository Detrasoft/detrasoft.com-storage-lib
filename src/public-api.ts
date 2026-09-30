/*
 * API pública da @detrasoft.com/storage
 *
 * Upload, download e gestão de arquivos para o Storage-Server Detrasoft.
 * Depende apenas do storage-server e da @detrasoft.com/detra-ng.
 */

/* ── Configuração / providers ── */
export * from './lib/storage.config';

/* ── Models ── */
export * from './lib/models/file-storage.model';

/* ── Services ── */
export * from './lib/services/storage-file.service';

/* ── Utils ── */
export * from './lib/utils/file.util';

/* ── Components ── */
export { StorageAttachmentsComponent } from './lib/components/attachments/attachments.component';
export { StorageFilePreviewComponent } from './lib/components/file-preview/file-preview.component';
