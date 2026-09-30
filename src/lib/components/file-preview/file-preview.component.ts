import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  input,
  output,
  effect,
  OnDestroy,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  ChangeDetectorRef,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { Overlay, OverlayModule, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { FileStorage } from '../../models/file-storage.model';
import { StorageFileService } from '../../services/storage-file.service';
import { STORAGE_CONFIG, ResolvedStorageConfig } from '../../storage.config';

@Component({
  selector: 'ds-storage-file-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, OverlayModule],
  template: `
    <ng-template #previewTemplate>
      <div class="preview-backdrop" (click)="close()"></div>
      <div class="preview-modal" role="dialog" aria-labelledby="preview-title" (click)="$event.stopPropagation()">
        <header class="preview-header">
          <div class="preview-title">
            <i class="fa-solid fa-eye"></i>
            <h2 id="preview-title" [title]="fileName()">{{ fileName() }}</h2>
          </div>
          <div class="preview-actions">
            <button type="button" class="clay-btn clay-btn--ghost btn-download"
                    (click)="onDownload()" title="Baixar arquivo original">
              <i class="fa-solid fa-download"></i> {{ labels.previewDownloadBtn }}
            </button>
            <button type="button" class="btn-close" (click)="close()" title="Fechar">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </header>

        <div class="preview-body">
          @if (loading()) {
            <div class="preview-loading">
              <div class="spinner"></div>
              <p>Carregando preview…</p>
            </div>
          } @else if (previewMode() === 'pdf') {
            <iframe [src]="safeBlobUrl()" class="preview-iframe" title="Preview PDF"></iframe>
          } @else if (previewMode() === 'image') {
            <div class="preview-image-wrapper">
              <img [src]="safeBlobUrl()" [alt]="fileName()" />
            </div>
          } @else if (previewMode() === 'html') {
            <div class="preview-html-content" [innerHTML]="safeHtml()"></div>
          } @else {
            <div class="preview-unsupported">
              <i class="fa-solid fa-file-circle-question"></i>
              <p>{{ labels.previewUnsupportedText }}</p>
              <button class="clay-btn clay-btn--primary" (click)="onDownload()">
                <i class="fa-solid fa-download"></i> {{ labels.previewDownloadBtn }}
              </button>
            </div>
          }
        </div>
      </div>
    </ng-template>
  `,
  styleUrl: './file-preview.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class StorageFilePreviewComponent implements OnDestroy {
  private readonly storageFileSvc = inject(StorageFileService);
  private readonly sanitizer      = inject(DomSanitizer);
  private readonly overlay        = inject(Overlay);
  private readonly vcr            = inject(ViewContainerRef);
  private readonly cdr            = inject(ChangeDetectorRef);
  private readonly config: ResolvedStorageConfig = inject(STORAGE_CONFIG);

  @ViewChild('previewTemplate') previewTemplate!: TemplateRef<unknown>;
  private overlayRef: OverlayRef | null = null;

  readonly open = input<boolean>(false);
  readonly file = input<FileStorage | null>(null);

  readonly closed   = output<void>();
  readonly download = output<FileStorage>();

  readonly loading     = signal(false);
  readonly rawHtml     = signal<string>('');
  readonly blobUrl     = signal<string>('');
  readonly previewMode = signal<'html' | 'pdf' | 'image' | 'unsupported'>('unsupported');

  get labels() {
    return this.config.labels;
  }

  readonly fileName = computed(() => {
    const f = this.file();
    return f?.originalName ?? f?.name ?? 'Arquivo';
  });

  readonly safeHtml = computed<SafeHtml>(() => {
    return this.sanitizer.bypassSecurityTrustHtml(this.rawHtml());
  });

  readonly safeBlobUrl = computed<SafeResourceUrl>(() => {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrl());
  });

  private activeObjectUrl: string | null = null;

  constructor() {
    effect(() => {
      const isOpen = this.open();
      const currentFile = this.file();

      if (isOpen && currentFile) {
        this.openOverlay();
        this.loadPreview(currentFile);
      } else {
        this.closeOverlay();
        this.cleanup();
      }
    }, { allowSignalWrites: true });
  }

  ngOnDestroy(): void {
    this.closeOverlay();
    this.cleanup();
  }

  private openOverlay(): void {
    if (this.overlayRef) return;

    if (!this.previewTemplate) {
      setTimeout(() => this.openOverlay(), 0);
      return;
    }

    const positionStrategy = this.overlay
      .position()
      .global()
      .centerHorizontally()
      .centerVertically();

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.block(),
      hasBackdrop: false,
      disposeOnNavigation: true,
    });

    const portal = new TemplatePortal(this.previewTemplate, this.vcr);
    this.overlayRef.attach(portal);
    this.cdr.markForCheck();
  }

  private closeOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  private loadPreview(file: FileStorage): void {
    this.cleanup();
    this.loading.set(true);

    const fileId = file.id ?? file.fileId;
    if (!fileId) {
      this.previewMode.set('unsupported');
      this.loading.set(false);
      return;
    }

    const name = file.originalName ?? file.name ?? '';
    const ext  = name.split('.').pop()?.toLowerCase() ?? '';
    const type = file.type ?? file.contentType ?? '';
    const isDocExt = ['docx', 'xlsx', 'pptx', 'md', 'txt', 'log', 'csv', 'json', 'xml', 'yml', 'yaml'].includes(ext);

    // Case 1: Convertable HTML Preview
    if (file.previewable || isDocExt) {
      this.storageFileSvc.getFilePreview(fileId).subscribe({
        next: (res) => {
          const html = res?.data?.htmlContent;
          if (html) {
            this.rawHtml.set(html);
            this.previewMode.set('html');
          } else {
            this.previewMode.set('unsupported');
          }
          this.loading.set(false);
        },
        error: () => {
          this.rawHtml.set('<p style="padding:2rem; text-align:center; color:#ef4444;">Erro ao carregar preview do arquivo.</p>');
          this.previewMode.set('html');
          this.loading.set(false);
        },
      });
      return;
    }

    // Case 2: PDF
    if (type.includes('pdf') || ext === 'pdf') {
      this.storageFileSvc.downloadPrivateFile(fileId).subscribe({
        next: (blob) => {
          const pdfBlob = new Blob([blob], { type: 'application/pdf' });
          const url = URL.createObjectURL(pdfBlob);
          this.activeObjectUrl = url;
          this.blobUrl.set(url);
          this.previewMode.set('pdf');
          this.loading.set(false);
        },
        error: () => {
          this.previewMode.set('unsupported');
          this.loading.set(false);
        },
      });
      return;
    }

    // Case 3: Images
    if (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
      this.storageFileSvc.downloadPrivateFile(fileId).subscribe({
        next: (blob) => {
          const mime = type.startsWith('image/') ? type : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
          const imgBlob = new Blob([blob], { type: mime });
          const url = URL.createObjectURL(imgBlob);
          this.activeObjectUrl = url;
          this.blobUrl.set(url);
          this.previewMode.set('image');
          this.loading.set(false);
        },
        error: () => {
          this.previewMode.set('unsupported');
          this.loading.set(false);
        },
      });
      return;
    }

    // Case 4: Fallback Unsupported
    this.previewMode.set('unsupported');
    this.loading.set(false);
  }

  close(): void {
    this.closeOverlay();
    this.cleanup();
    this.closed.emit();
  }

  onDownload(): void {
    const f = this.file();
    if (f) this.download.emit(f);
  }

  private cleanup(): void {
    if (this.activeObjectUrl) {
      URL.revokeObjectURL(this.activeObjectUrl);
      this.activeObjectUrl = null;
    }
    this.blobUrl.set('');
    this.rawHtml.set('');
  }
}
