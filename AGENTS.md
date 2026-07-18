# S3 Web Client - Architecture & Implementation Plan

## 1. Project Overview
A stateless web-based S3/R2 client. Users connect by entering their AWS/Cloudflare credentials, which are encrypted (AES-256-GCM) and stored exclusively in an HTTP-only browser cookie. No database, no authentication, no user accounts — credentials never touch server-side storage.

## 2. Tech Stack
- **Framework**: Next.js (App Router)
- **Deployment target**: Railway
- **Styling**: Tailwind CSS
- **Backend/Logic**: Server Actions, AWS S3 SDK
- **Language**: TypeScript
- **Package Manager**: Bun

## 3. Architecture & Security
- **Authentication**: None. The app is open — anyone can connect their own S3/R2 credentials.
- **Credentials Management**:
  - S3/R2 credentials are encrypted client-side with AES-256-GCM using the `ENCRYPTION_KEY` env var.
  - Encrypted connections are stored as a JSON array in a single HTTP-only, Strict-SameSite cookie (`s3-connections`).
  - No credentials are ever stored in a database or on the server filesystem.
  - The encryption key is the only secret — stored as an environment variable on the deployment platform.
- **S3/R2 Interaction**:
  - Server Actions decrypt credentials from the cookie on each request.
  - The S3 client is instantiated server-side with the decrypted credentials.
  - No credentials are exposed to the client-side JavaScript.
- **Multi-Connection**: Multiple connections (S3 + R2) are supported via an encrypted array in the cookie.

## 3.5 Folder Structure
```
src/
  app/              # Next.js App Router
    (dashboard)/    # Main app routes (no auth required)
    (info)/         # Static info pages (privacy, terms)
    layout.tsx      # Root layout
    page.tsx        # Landing page
  components/       # React Components
    ui/             # Reusable UI components (Button, Card, Input, Label)
    s3/             # S3-specific components (FileExplorer, SidebarNav, etc.)
  lib/              # Utilities and Helpers
    s3.ts           # S3 Client factory (reads credentials from cookie)
    encryption.ts   # AES-256-GCM encryption/decryption
    preferences.ts  # User display preferences (cookie-backed)
    types.ts        # TypeScript types and Zod schemas
    utils.ts        # General utilities (cn, getPublicObjectUrl)
  actions/          # Server Actions
    s3-actions.ts        # S3/R2 operations (listBuckets, listObjects, upload, delete, etc.)
    credentials-actions.ts # Connection CRUD (add, list, get, update, remove) — cookie-backed
```

## 4. Implementation Status

### Phase 1: Foundation & Security (Complete)
- [x] Encryption system: AES-256-GCM via `ENCRYPTION_KEY` env var.
- [x] Connection form that encrypts credentials and stores them in an HTTP-only cookie.
- [x] Multi-connection support via encrypted JSON array in a single cookie.

### Phase 2: Core S3 Services (Complete)
- [x] S3 Client factory (`src/lib/s3.ts`) reads decrypted credentials from cookie.
- [x] Server Actions for:
  - `listBuckets`
  - `listObjects` (with sorting and pagination)
  - `putObject` (upload)
  - `getObject` (presigned download URL)
  - `deleteObject` / `deleteObjects` (bulk)
  - `copyObject` (rename)
  - `searchObjects`
  - `countObjects`
  - `createFolder`
  - `makePublic`
  - `getFileContent` (text preview)

### Phase 3: Dashboard & File Explorer UI (Complete)
- [x] Dashboard: Card view of connections (S3 and R2 grouped).
- [x] Connection management: add, edit, delete.
- [x] Bucket browser: card view of buckets per connection.
- [x] File Explorer:
  - Breadcrumb navigation.
  - List/Grid view toggle.
  - File type icons.
  - Pagination.
  - Sorting (date, name).
  - Search within folder.
- [x] Upload: drag-and-drop zone with progress indicators and bulk upload.
- [x] Sidebar navigation with active connection list.
- [x] Dark/light theme toggle.

### Phase 4: File Context Actions (Complete)
- [x] Context menu per file/folder.
- [x] Preview (images, PDF, text).
- [x] Download (presigned URL).
- [x] Rename.
- [x] Delete (single and bulk).
- [x] Copy key.
- [x] Make public / copy public URL.
- [x] New folder.
- [x] Bulk selection (checkbox + ctrl/meta click) with bulk actions.

### Phase 5: Polish & Advanced Features (In Progress)
- [x] File previews (images, PDF, text files).
- [x] Error handling with toast notifications.
- [x] Optimistic UI for deletes.
- [x] R2 public URL support.
- [x] User preferences (view mode, items per page) stored in cookie.
- [ ] Progress bar refinements.
- [ ] Right-click context menu (currently click-based).

## 5. Data Model

### Cookie: `s3-connections` (Encrypted)
```
Cookie contains: Encrypt(JSON.stringify(StoredConnection[]))
```

**StoredConnection** (before encryption):
```json
{
  "id": "uuid",
  "name": "Production S3",
  "type": "s3 | r2",
  "encryptedCredentials": "AES-256-GCM encrypted { accessKeyId, secretAccessKey }",
  "region": "us-east-1",
  "endpoint": null,
  "bucket": null
}
```

**ConnectionInfo** (returned by list/get, no credentials exposed):
```json
{
  "id": "uuid",
  "name": "Production S3",
  "type": "s3 | r2",
  "region": "us-east-1",
  "endpoint": null,
  "bucket": null
}
```

### Cookie: `user_prefs` (Plain)
```json
{
  "viewMode": "list | grid",
  "itemsPerPage": 20
}
```

## 6. Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `ENCRYPTION_KEY` | Yes | Key for AES-256-GCM encryption (hashed with SHA-256 internally) |
| `R2_PUBLIC_URL` | No | Base URL for constructing R2 public object URLs |

## 7. Key Design Decisions
- **No DB, no auth**: Chosen to eliminate attack surface. An attacker who compromises the server gets zero stored credentials (only what's in-flight during active sessions).
- **Cookie over localStorage**: HTTP-only cookies are inaccessible to JavaScript, preventing XSS-based credential theft.
- **Multi-connection array**: Instead of one cookie per connection, all connections share a single encrypted cookie to stay within browser cookie limits.
