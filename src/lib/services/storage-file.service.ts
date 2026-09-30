import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { STORAGE_CONFIG, ResolvedStorageConfig } from '../storage.config';
import { FileStorage } from '../models/file-storage.model';

/**
 * Serviço de integração com o Storage-Server Detrasoft.
 *
 * Não depende de `environment.ts`: todas as URLs são resolvidas
 * a partir do `STORAGE_CONFIG` injetado via `provideStorage()`.
 */
@Injectable({
  providedIn: 'root',
})
export class StorageFileService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(STORAGE_CONFIG);

  private get fileApiUrl(): string {
    return `${this.config.baseUrl}${this.config.apiPath}/file`;
  }

  private get downloadUrl(): string {
    return `${this.config.downloadBaseUrl}${this.config.downloadPath}`;
  }

  // ── Consultas ──────────────────────────────────────────────────────────────

  /**
   * Consulta os metadados dos arquivos vinculados a uma groupingKey.
   */
  getFileByGroupingKey(groupingKey: string): Observable<FileStorage[]> {
    return this.http.get<FileStorage[]>(`${this.fileApiUrl}/grouping-key/${groupingKey}`);
  }

  /**
   * Consulta o preview HTML e metadados de um arquivo por ID.
   */
  getFilePreview(fileId: string): Observable<any> {
    return this.http.get<any>(`${this.fileApiUrl}/${fileId}/preview`);
  }

  // ── Upload ─────────────────────────────────────────────────────────────────

  /**
   * Upload de arquivo privado.
   */
  uploadPrivateFile(
    file: File,
    folder: string,
    key?: string,
    confirmed = true,
    uniqueFile = false,
  ): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const queryParams = uniqueFile ? '?uniqueFile=true' : '?uniqueFile=false';
    const confirmedPath = confirmed ? '/confirmed' : '';

    let url = `${this.fileApiUrl}/private/${folder}`;
    if (key && key.trim().length > 0) {
      url += `/${key}`;
    }
    url += `${confirmedPath}${queryParams}`;

    return this.http.post(url, formData);
  }

  /**
   * Upload de arquivo público.
   */
  uploadPublicFile(
    file: File,
    folder: string,
    key?: string,
    confirmed = true,
    uniqueFile = false,
  ): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const queryParams = uniqueFile ? '?uniqueFile=true' : '?uniqueFile=false';
    const confirmedPath = confirmed ? '/confirmed' : '';

    let url = `${this.fileApiUrl}/public/${folder}`;
    if (key && key.trim().length > 0) {
      url += `/${key}`;
    }
    url += `${confirmedPath}${queryParams}`;

    return this.http.post(url, formData);
  }

  // ── Download ───────────────────────────────────────────────────────────────

  /**
   * Download privado por fileId.
   */
  downloadPrivateFile(fileId: string): Observable<Blob> {
    return this.http.get(`${this.downloadUrl}/private/${fileId}`, { responseType: 'blob' });
  }

  /**
   * Download público por fileId.
   */
  downloadPublicFile(fileId: string): Observable<Blob> {
    return this.http.get(`${this.downloadUrl}/public/${fileId}`, { responseType: 'blob' });
  }

  /**
   * Download legado por ID.
   */
  downloadFile(id: string): Observable<Blob> {
    return this.http.get(`${this.fileApiUrl}/${id}`, { responseType: 'blob' });
  }

  // ── Confirmação ────────────────────────────────────────────────────────────

  /**
   * Confirma um arquivo alterando seu status de PENDING para CONFIRMED.
   */
  confirmFile(id: string): Observable<any> {
    return this.http.put(`${this.fileApiUrl}/${id}`, {});
  }

  /**
   * Confirma todos os arquivos vinculados a uma chave.
   */
  confirmFilesByKey(key: string): Observable<any> {
    return this.http.put(`${this.fileApiUrl}/key/${key}`, {});
  }

  // ── Deleção ────────────────────────────────────────────────────────────────

  /**
   * Deleta arquivo por ID.
   */
  deleteFile(id: string): Observable<any> {
    return this.http.delete(`${this.fileApiUrl}/${id}`);
  }

  /**
   * Deleta arquivo privado por ID.
   */
  deletePrivateFile(id: string): Observable<any> {
    return this.http.delete(`${this.fileApiUrl}/private/${id}`);
  }

  /**
   * Deleta arquivo público por ID.
   */
  deletePublicFile(id: string): Observable<any> {
    return this.http.delete(`${this.fileApiUrl}/public/${id}`);
  }

  // ── Batch ──────────────────────────────────────────────────────────────────

  /**
   * Conta arquivos por múltiplas chaves de agrupamento (batch).
   * Retorna um mapa `{ [groupingKey]: count }`.
   */
  countByGroupingKeys(keys: string[]): Observable<Record<string, number>> {
    if (!keys || keys.length === 0) {
      return of({});
    }
    return this.http.post<Record<string, number>>(`${this.fileApiUrl}/count-by-keys`, keys);
  }
}
