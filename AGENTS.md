# S3 Web Client - Implementation Plan (GEMINI.md)

## 1. Project Overview
A web-based S3 client that allows users to manage their Amazon S3 buckets and files. Users will authenticate via Better-Auth, and then input their AWS Access Key and Secret, which will be securely associated with their account for persistent sessions.

## 2. Tech Stack
- **Framework**: Next.js (App Router)
- **Deployment target**: Cloudflare Workers / Pages
- **Styling**: Tailwind CSS
- **Authentication**: Better-Auth
- **Backend/Logic**: Cloudflare Workers (via Next.js API routes or Server Actions), AWS S3 SDK
- **Language**: TypeScript
- **Package Manager**: Bun

## 3. Architecture & Security
- **Authentication**: Users sign in using Better-Auth (email/password or social).
- **AWS Credentials Management**:
  - AWS Access Key and Secret Key are input by the user.
  - These credentials must be stored securely (encrypted) associated with the user record in the database.
  - *Note*: Since we are running on Cloudflare, we need to ensure the encryption/decryption keys are managed via environment variables.
- **S3 Interaction**:
  - Server-side (Server Actions/API Routes) will instantiate the AWS S3 Client using the user's stored credentials for each request.
  - No AWS credentials will be exposed to the client-side.

## 3.5 Proposed Folder Structure
```
src/
  app/              # Next.js App Router
    (auth)/         # Authentication routes
    (dashboard)/    # Main app routes (protected)
    api/            # API routes
    layout.tsx      # Root layout
    page.tsx        # Landing page
  components/       # React Components
    ui/             # Reusable UI components
    s3/             # S3 specific components
    layout/         # Layout components
  lib/              # Utilities and Helpers
    auth-client.ts  # Better-Auth client
    auth.ts         # Better-Auth server config
    s3.ts           # S3 Client factory
    encryption.ts   # Encryption (AES-GCM)
    utils.ts        # General utilities
  actions/          # Server Actions
    s3-actions.ts   # S3 operations
    auth-actions.ts # Cookie management
```

## 4. Implementation phases

### Phase 1: Foundation & Security (Stateless)
- [ ] Configure `better-auth` (using a lightweight adapter or KV if needed for user persistence, or purely social).
- [ ] **Encryption System**: Implement `encrypt` and `decrypt` utilities using `AES-256-GCM`.
  - Keys will be encrypted on the server using a `SECRET_KEY` env variable.
  - The encrypted blob will be stored in a secure, HTTP-only cookie.
- [ ] Create a "Connect S3" form that takes credentials, encrypts them, and sets the cookie.

### Phase 2: Core S3 Services
- [ ] Create a service layer/utility to instantiate the S3 Client dynamically by:
  1. Reading the encrypted cookie from the request.
  2. Decrypting the credentials.
  3. initializing the S3 Client.
- [ ] Implement API endpoints/Server Actions for:
  - `listBuckets`
  - `listObjects`
  - `putObject`
  - `getObject`
  - `deleteObject`
  - `copyObject`

### Phase 3: Dashboard & File Explorer UI
- [ ] **Dashboard**: Card view of available Buckets.
- [ ] **File Explorer**:
  - Breadcrumb navigation.
  - List/Grid view.
  - File icons.
- [ ] **Upload Mechanism**:
  - Drag-and-drop zone.
  - Progress bar.

### Phase 4: File Context Actions
- [ ] Right-click context menu.
- [ ] Implementation of:
  - "Get Public URL"
  - "Generate Presigned URL"
  - "Rename"
  - "Delete"
  - "Permissions"

### Phase 5: Polish & Advanced Features
- [ ] **Previews**: Images, PDF, text.
- [ ] **Error Handling**: Standardized toasts.
- [ ] **Optimistic UI**.

## 5. Data Model (Stateless)
**Cookie Payload (Encrypted)**:
```json
{
  "accessKeyId": "...",
  "secretAccessKey": "...",
  "region": "us-east-1" // optional
}
```
*Security Note*: The cookie itself serves as the persistent storage. We rely on the browser to hold the data.

## 6. Next Steps
1. Validated this plan.
2. Setup Next.js + Better-Auth.
3. Implement Encryption Utilities.
