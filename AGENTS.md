# S3 Web Client

Stateless S3/R2 browser. No auth, no database — credentials are AES-256-GCM encrypted and stored in an HTTP-only cookie.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS · Bun · AWS S3 SDK · Zod

## Run

```bash
bun install
bun dev        # http://localhost:3000
bun run build  # production build
```

> No `.env` setup required. Optionally set `ENCRYPTION_KEY` for a server-side encryption key fallback. Without it, each browser generates its own key on first use via Settings.

## Folder Structure

```
src/
  actions/
    credentials-actions.ts  # Cookie-backed connection CRUD (add, list, get, update, remove)
    key-actions.ts          # Encryption key management (set, change, remove)
    s3-actions.ts           # All S3/R2 operations
  app/
    (dashboard)/            # Main app routes, no auth required
    (info)/                 # Static pages (privacy, terms)
    page.tsx                # Landing page
    layout.tsx              # Root layout (ThemeProvider, Toaster)
  components/
    s3/                     # FileExplorer, SidebarNav, UploadZone, ObjectActions, PreviewModal, dialogs
    ui/                     # Button, Card, Input, Label
  lib/
    s3.ts                   # getS3Client(id) → reads decrypted credentials from cookie, returns S3Client
    encryption.ts           # AES-256-GCM encrypt/decrypt wrappers
    types.ts                # All TypeScript types + Zod schemas
    preferences.ts          # getUserPrefs() → reads user_prefs cookie
    utils.ts                # cn(), getPublicObjectUrl()
```

## Architecture

```
Browser                    Server
┌──────────┐              ┌────────────────────────────┐
│ Cookie:  │  ──request──→│ credentials-actions.ts     │
│ s3-conn. │              │  decrypts cookie array     │
│ (encrypt)│              │  finds connection by ID    │
└──────────┘              │         ↓                  │
                          │ s3.ts: getS3Client(id)     │
                          │  decrypts inner creds blob │
                          │  creates S3Client          │
                          │         ↓                  │
                          │ s3-actions.ts              │
                          │  uses S3Client for ops     │
                          └────────────────────────────┘
```

- **No authentication** — anyone can use the tool with their own credentials.
- **Credentials** — encrypted with `AES-256-GCM`. The encryption key is stored in an HTTP-only `s3-key` cookie, or falls back to the `ENCRYPTION_KEY` env var if no cookie is set (or a dev default in development).
- **Multi-connection** — cookie stores an encrypted JSON array of `StoredConnection[]`.
- **S3 client** — created server-side per request; credentials never reach the browser after initial save.
- **Preferences** — view mode and page size stored in plain `user_prefs` cookie.

## Data Model

### `s3-key` cookie (HTTP-only, Strict-SameSite, 10 years)

Stores the user's encryption passphrase in plain text (only readable server-side via HTTP-only). Used as the AES-256-GCM key to encrypt/decrypt the `s3-connections` cookie. Falls back to `ENCRYPTION_KEY` env var if absent.

### `s3-connections` cookie (HTTP-only, Strict-SameSite, 30 days)

Encrypted contents:
```jsonc
[
  {
    "id": "uuid",
    "name": "Production S3",
    "type": "s3",                    // "s3" | "r2"
    "encryptedCredentials": "...",   // AES-256-GCM({ accessKeyId, secretAccessKey })
    "region": "us-east-1",
    "endpoint": null,                // R2 endpoint URL
    "bucket": null,                  // optional default bucket
    "publicUrl": null                // optional public base URL for object links
  }
]
```

**ConnectionInfo** (returned by `listConnections()` / `getConnection()` — no credentials):
```json
{ "id", "name", "type", "region", "endpoint", "bucket", "publicUrl" }
```

**DecryptedConnection** (internal: `getDecryptedConnection()`) extends `ConnectionInfo` with `accessKeyId` + `secretAccessKey`.

### `user_prefs` cookie (plain)
```json
{ "viewMode": "list", "itemsPerPage": 20 }
```

## Coding Patterns

### Server Actions

All server-side logic lives in `src/actions/`. Files use `"use server"` directive. Actions are called from server components (directly) and client components (via async functions).

```typescript
// Server component — direct call
const connections = await listConnections();

// Client component — async handler
const result = await addConnection(data);
```

### S3 Operations

All S3 operations take `connectionId` as the first parameter. Internally, `getS3Client(connectionId)` reads the decrypted credentials from the cookie array. Client components that need S3 operations receive `connectionId` as a prop from their server component parent.

```typescript
// All s3-actions.ts functions follow this pattern:
export async function listObjects(connectionId: string, bucket: string, ...) {
  const client = await getS3Client(connectionId);  // decrypts cookie → S3Client
  const response = await client.send(new ListObjectsV2Command({...}));
  ...
}
```

To add a new S3 operation: add the function to `src/actions/s3-actions.ts`, re-export or call it from components as needed. No other changes required — `connectionId` and cookie decryption are handled automatically.

### Dynamic Pages

Pages that read cookies are marked `export const dynamic = "force-dynamic"` to prevent stale static generation.

### Components

- **Server components**: Page-level (`page.tsx`, `layout.tsx`) — fetch data, pass props down.
- **Client components**: Interactive (`"use client"`) — forms, file explorer, dialogs. All located in `src/components/s3/`.
- **Prefer co-location**: Form components live next to their pages (e.g., `add-connection-form.tsx` in the same route folder).

### Error Handling

Server actions return `{ success: true }` or `{ error: "message" }`. Client components check the result and display `toast.error()` or `toast.success()` from `sonner`. Exceptions thrown in actions are caught and logged server-side.

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `ENCRYPTION_KEY` | No | AES-256-GCM key (hashed to 32 bytes via SHA-256). Falls back to `s3-key` cookie if absent |
| ~~`R2_PUBLIC_URL`~~ | ~~No~~ | **Removed** — use per-connection `publicUrl` field instead |

## Features

- Multi-connection (S3 + R2) with add/edit/delete
- Bucket browser with card layout
- File explorer: list/grid views, breadcrumbs, sorting, search, pagination
- Drag-and-drop upload with progress, bulk upload, public/private toggle
- Object actions: preview (images, PDF, text), download, rename, delete, bulk delete, make public, copy key/URL
- Dark/light theme toggle
- User preferences (view mode, page size) persisted in cookie

## Key Decisions

- **No DB, no auth**: Server breach leaks zero stored credentials — only in-flight data.
- **HTTP-only cookie**: Credentials inaccessible to JavaScript, preventing XSS theft.
- **Single cookie array**: All connections in one encrypted cookie avoids browser cookie limits.
- **AES-256-GCM**: Authenticated encryption prevents tampering and ciphertext manipulation.
- **Cookie-backed encryption key**: Encryption key stored in a separate HTTP-only `s3-key` cookie, falling back to `ENCRYPTION_KEY` env var. Zero server config required.
