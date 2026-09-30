import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent, ConfirmDialogComponent } from '@detrasoft.com/detra-ng';
import { StorageFileService } from '../../services/storage-file.service';
import { STORAGE_CONFIG, ResolvedStorageConfig } from '../../storage.config';
import { FileStorage } from '../../models/file-storage.model';
import { StorageFilePreviewComponent } from '../file-preview/file-preview.component';
import { formatFileSize, getFileIcon, getFileColor } from '../../utils/file.util';

@Component({
  selector: 'ds-storage-attachments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonComponent, ConfirmDialogComponent, StorageFilePreviewComponent],
  templateUrl: './attachments.component.html',
  styleUrls: ['./attachments.component.scss'],
})
export class StorageAttachmentsComponent implements OnInit, OnChanges {
  private readonly storageFileService = inject(StorageFileService);
  private readonly config: ResolvedStorageConfig = inject(STORAGE_CONFIG);

  @Input() folder: string = '';
  @Input() groupingKey: string = '';
  @Input() isPrivate: boolean = true;
  @Input() autoConfirm: boolean = true;
  @Input() uniqueFile: boolean = false;
  @Input() readOnly: boolean = false;
  @Input() maxFileSize?: number;
  @Input() title: string = '';
  @Input() showHeader: boolean = true;
  @Input() compact: boolean = false;

  @Output() fileUploaded = new EventEmitter<FileStorage>();
  @Output() fileDeleted = new EventEmitter<string>();
  @Output() attachmentsChanged = new EventEmitter<FileStorage[]>();

  readonly attachments = signal<FileStorage[]>([]);
  readonly loading = signal<boolean>(false);
  readonly uploading = signal<boolean>(false);
  readonly isDragOver = signal<boolean>(false);
  readonly confirmDeleteModal = signal<{ open: boolean; file: FileStorage | null }>({
    open: false,
    file: null,
  });
  readonly deleting = signal<boolean>(false);

  readonly previewOpen = signal<boolean>(false);
  readonly previewFile = signal<FileStorage | null>(null);

  /** Labels resolvidos (config + defaults) */
  get labels() {
    return this.config.labels;
  }

  ngOnInit(): void {
    // Aplica defaults do config se não foram fornecidos via @Input
    if (!this.folder) {
      this.folder = this.config.defaultFolder;
    }
    if (!this.title) {
      this.title = this.config.labels.attachmentsTitle;
    }
    if (this.groupingKey) {
      this.loadAttachments();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['groupingKey'] && !changes['groupingKey'].firstChange) {
      if (this.groupingKey) {
        this.loadAttachments();
      } else {
        this.attachments.set([]);
        this.attachmentsChanged.emit([]);
      }
    }
  }

  loadAttachments(key?: string): void {
    const targetKey = key || this.groupingKey;
    if (!targetKey) return;

    this.loading.set(true);
    this.storageFileService.getFileByGroupingKey(targetKey).subscribe({
      next: (list) => {
        const files = Array.isArray(list) ? list : [];
        this.attachments.set(files);
        this.attachmentsChanged.emit(files);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar anexos:', err);
        this.loading.set(false);
      },
    });
  }

  openPreview(file: FileStorage): void {
    this.previewFile.set(file);
    this.previewOpen.set(true);
  }

  closePreview(): void {
    this.previewOpen.set(false);
    this.previewFile.set(null);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFiles(Array.from(input.files));
      input.value = '';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.readOnly) {
      this.isDragOver.set(true);
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    if (this.readOnly) return;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.uploadFiles(Array.from(event.dataTransfer.files));
    }
  }

  uploadFiles(files: File[]): void {
    if (!files || files.length === 0 || this.readOnly) return;
    if (!this.groupingKey) {
      console.warn('Aviso: É necessário salvar o registro para associar anexos.');
      return;
    }

    this.uploading.set(true);
    let completedCount = 0;
    const totalFiles = files.length;

    files.forEach((file) => {
      const upload$ = this.isPrivate
        ? this.storageFileService.uploadPrivateFile(
            file,
            this.folder,
            this.groupingKey,
            this.autoConfirm,
            this.uniqueFile,
          )
        : this.storageFileService.uploadPublicFile(
            file,
            this.folder,
            this.groupingKey,
            this.autoConfirm,
            this.uniqueFile,
          );

      upload$.subscribe({
        next: (response) => {
          const fileData: FileStorage = response?.data || response || {
            name: file.name,
            size: file.size,
            type: file.type,
            groupingKey: this.groupingKey,
          };

          this.fileUploaded.emit(fileData);
          completedCount++;

          if (completedCount === totalFiles) {
            this.uploading.set(false);
            this.loadAttachments();
          }
        },
        error: (err) => {
          console.error(`Erro ao enviar arquivo ${file.name}:`, err);
          completedCount++;
          if (completedCount === totalFiles) {
            this.uploading.set(false);
            this.loadAttachments();
          }
        },
      });
    });
  }

  downloadFile(file: FileStorage): void {
    const fileId = file.id || file.fileId;
    if (!fileId) return;

    const download$ = this.isPrivate
      ? this.storageFileService.downloadPrivateFile(fileId)
      : this.storageFileService.downloadPublicFile(fileId);

    download$.subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name || 'anexo';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Erro ao baixar arquivo:', err);
        // Fallback para endpoint legado
        this.storageFileService.downloadFile(fileId).subscribe({
          next: (blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name || 'anexo';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          },
          error: (fallbackErr) => console.error('Erro no fallback de download:', fallbackErr),
        });
      },
    });
  }

  /** Mensagem exibida no dialog de confirmação de exclusão. */
  confirmDeleteMessage(): string {
    const name = this.confirmDeleteModal().file?.name || '';
    return this.config.labels.deleteConfirmMessage(name);
  }

  confirmDelete(file: FileStorage): void {
    if (this.readOnly) return;
    this.confirmDeleteModal.set({ open: true, file });
  }

  closeConfirmDelete(): void {
    this.confirmDeleteModal.set({ open: false, file: null });
  }

  executeDelete(): void {
    const modalState = this.confirmDeleteModal();
    const file = modalState.file;
    if (!file || !file.id) return;

    this.deleting.set(true);
    const delete$ = this.isPrivate
      ? this.storageFileService.deletePrivateFile(file.id)
      : this.storageFileService.deletePublicFile(file.id);

    delete$.subscribe({
      next: () => {
        this.deleting.set(false);
        this.closeConfirmDelete();
        this.fileDeleted.emit(file.id);
        const updated = this.attachments().filter((f) => f.id !== file.id);
        this.attachments.set(updated);
        this.attachmentsChanged.emit(updated);
      },
      error: (err) => {
        console.error('Erro ao deletar arquivo:', err);
        // Fallback para endpoint padrão
        this.storageFileService.deleteFile(file.id!).subscribe({
          next: () => {
            this.deleting.set(false);
            this.closeConfirmDelete();
            this.fileDeleted.emit(file.id);
            const updated = this.attachments().filter((f) => f.id !== file.id);
            this.attachments.set(updated);
            this.attachmentsChanged.emit(updated);
          },
          error: (fallbackErr) => {
            console.error('Erro no fallback de exclusão:', fallbackErr);
            this.deleting.set(false);
            this.closeConfirmDelete();
          },
        });
      },
    });
  }

  /** Proxy para o template */
  formatFileSize = formatFileSize;
  getIconFile = getFileIcon;
  getColorByExtension = getFileColor;
}
