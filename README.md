# @detrasoft.com/storage

Upload, download e gestão de arquivos para o **Storage-Server** Detrasoft.  
Componente de anexos pronto para uso com drag-and-drop, preview e integração com `@detrasoft.com/detra-ng`.

## Instalação

```bash
npm install @detrasoft.com/storage
```

### Configurar `.npmrc` local

Crie ou edite o arquivo `.npmrc` na raiz do seu projeto:

```ini
@detrasoft.com:registry=https://npm.detrasoft.com/
//npm.detrasoft.com/:_authToken=SEU_TOKEN_AQUI
```

> **Dica:** Obtenha o token com `npm --registry https://npm.detrasoft.com token create`.

## Uso

### 1. Registrar o provider no app

```ts
// app.config.ts
import { provideStorage } from '@detrasoft.com/storage';

export const appConfig = {
  providers: [
    provideStorage({
      baseUrl: environment.apiURLStorage,
      // downloadBaseUrl: environment.apiUrlAuth,  // opcional
      // defaultFolder: 'tasks',                   // opcional
    }),
  ],
};
```

### 2. Usar o componente de anexos

```html
<ds-storage-attachments
  [groupingKey]="entityId"
  folder="tasks"
  [isPrivate]="true"
  (fileUploaded)="onFileUploaded($event)"
  (fileDeleted)="onFileDeleted($event)"
/>
```

### 3. Usar o serviço diretamente (opcional)

```ts
import { StorageFileService } from '@detrasoft.com/storage';

@Component({ ... })
export class MyComponent {
  private storage = inject(StorageFileService);

  upload(file: File) {
    this.storage.uploadPrivateFile(file, 'tasks', this.entityId).subscribe();
  }
}
```

## Inputs do `StorageAttachmentsComponent`

| Input | Tipo | Default | Descrição |
|---|---|---|---|
| `groupingKey` | `string` | `''` | Chave de agrupamento (ex: entityId) |
| `folder` | `string` | config `defaultFolder` | Pasta no storage |
| `isPrivate` | `boolean` | `true` | Upload privado ou público |
| `autoConfirm` | `boolean` | `true` | Confirma arquivo após upload |
| `uniqueFile` | `boolean` | `false` | Substitui arquivo com mesmo nome |
| `readOnly` | `boolean` | `false` | Desabilita upload e exclusão |
| `title` | `string` | `'Anexos'` | Título do card |
| `showHeader` | `boolean` | `true` | Exibe o cabeçalho |
| `compact` | `boolean` | `false` | Modo compacto sem card |

## Outputs

| Output | Tipo | Descrição |
|---|---|---|
| `fileUploaded` | `FileStorage` | Emitido após upload de cada arquivo |
| `fileDeleted` | `string` | Emitido após exclusão (id do arquivo) |
| `attachmentsChanged` | `FileStorage[]` | Emitido quando a lista muda |

## Customização de Tema (CSS Custom Properties)

```css
:root {
  --storage-primary: #6366f1;
  --storage-primary-dark: #4338ca;
  --storage-surface: #ffffff;
  --storage-border: rgba(230, 226, 248, 0.8);
  --storage-text: #1e293b;
  --storage-text-muted: #64748b;
  --storage-card-bg: #ffffff;
  --storage-card-border: #e2e8f0;
  --storage-dropzone-bg: #f8fafc;
  --storage-dropzone-border: #cbd5e1;
  --storage-badge-bg: #e0e7ff;
  --storage-badge-color: #4338ca;
}
```

> O tema dark é ativado automaticamente via `html.theme-dark`.

## Customização de Labels (i18n)

```ts
provideStorage({
  baseUrl: environment.apiURLStorage,
  labels: {
    attachmentsTitle: 'Attachments',
    dragDropHighlight: 'Drag and drop your files here',
    dragDropText: 'or browse your device',
    selectFilesBtn: 'Select files',
  },
});
```

## API Pública

### Models
- `FileStorage` — Interface de metadados do arquivo

### Services
- `StorageFileService` — CRUD completo (upload, download, delete, confirm, count)

### Utils
- `formatFileSize(bytes)` — Formata bytes em KB/MB/GB
- `getFileIcon(filename)` — Retorna classe FontAwesome por extensão
- `getFileColor(filename)` — Retorna cor temática por extensão

### Components
- `StorageAttachmentsComponent` (`<ds-storage-attachments>`)
- `StorageFilePreviewComponent` (`<ds-storage-file-preview>`)
