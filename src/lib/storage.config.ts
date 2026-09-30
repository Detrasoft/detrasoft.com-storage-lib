import { InjectionToken, Provider } from '@angular/core';

/**
 * Textos exibidos pela biblioteca. Todos têm padrão em pt-BR e podem ser
 * sobrescritos pelo app hospedeiro.
 */
export interface StorageLabels {
  attachmentsTitle: string;
  dragDropText: string;
  dragDropHighlight: string;
  selectFilesBtn: string;
  uploadingText: string;
  loadingText: string;
  deleteConfirmTitle: string;
  deleteConfirmMessage: (filename: string) => string;
  deleteConfirmBtn: string;
  deleteCancelBtn: string;
  previewUnsupportedText: string;
  previewDownloadBtn: string;
}

export interface StorageConfig {
  /**
   * URL base do storage-server (gateway), sem o path da API.
   * Ex.: `environment.apiURLStorage` ou `environment.apiUrlAuth`.
   */
  baseUrl: string;

  /**
   * Path da API de arquivos. Padrão: `/storage-server`.
   */
  apiPath?: string;

  /**
   * URL base alternativa para download de arquivos privados.
   * Quando omitida, usa `baseUrl`.
   */
  downloadBaseUrl?: string;

  /**
   * Path de download alternativo. Padrão: `/storage-server`.
   */
  downloadPath?: string;

  /** Pasta padrão para uploads. Padrão: `files`. */
  defaultFolder?: string;

  /** Tamanho máximo de arquivo em bytes. Omitir desabilita a validação. */
  maxFileSize?: number;

  /** Sobrescrita parcial dos textos. */
  labels?: Partial<StorageLabels>;
}

/** Configuração com todos os padrões aplicados. */
export type ResolvedStorageConfig = Required<Omit<StorageConfig, 'labels' | 'maxFileSize'>> & {
  labels: StorageLabels;
  maxFileSize: number | null;
};

export const STORAGE_DEFAULT_LABELS: StorageLabels = {
  attachmentsTitle: 'Anexos',
  dragDropText: 'ou navegue no seu dispositivo',
  dragDropHighlight: 'Arraste e solte seus arquivos aqui',
  selectFilesBtn: 'Selecionar arquivos',
  uploadingText: 'Enviando arquivo(s)...',
  loadingText: 'Carregando anexos...',
  deleteConfirmTitle: 'Excluir anexo',
  deleteConfirmMessage: (filename: string) =>
    `Tem certeza de que deseja excluir o arquivo "${filename}"? Esta ação não pode ser desfeita.`,
  deleteConfirmBtn: 'Excluir',
  deleteCancelBtn: 'Cancelar',
  previewUnsupportedText: 'Preview não disponível para este formato.',
  previewDownloadBtn: 'Baixar arquivo',
};

export const STORAGE_CONFIG = new InjectionToken<ResolvedStorageConfig>('STORAGE_CONFIG');

/** Aplica os padrões sobre a configuração informada pelo app hospedeiro. */
export function resolveStorageConfig(config: StorageConfig): ResolvedStorageConfig {
  return {
    baseUrl: config.baseUrl,
    apiPath: config.apiPath ?? '/storage-server',
    downloadBaseUrl: config.downloadBaseUrl ?? config.baseUrl,
    downloadPath: config.downloadPath ?? '/storage-server',
    defaultFolder: config.defaultFolder ?? 'files',
    maxFileSize: config.maxFileSize ?? null,
    labels: { ...STORAGE_DEFAULT_LABELS, ...config.labels },
  };
}

/**
 * Registra a `@detrasoft.com/storage` no app hospedeiro.
 *
 * ```ts
 * providers: [
 *   provideStorage({ baseUrl: environment.apiURLStorage }),
 * ]
 * ```
 */
export function provideStorage(config: StorageConfig): Provider {
  return {
    provide: STORAGE_CONFIG,
    useValue: resolveStorageConfig(config),
  };
}
