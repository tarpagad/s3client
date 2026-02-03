# S3 Web Client 🚀

A high-performance, secure, and beautiful web-based S3 client built with Next.js and deployed on Cloudflare Workers. Manage your Amazon S3 buckets and files with a native-like desktop experience directly in your browser.

## ✨ Features

### 🔐 Security First
- **AES-GCM Encryption**: AWS credentials are encrypted at rest using industry-standard AES-256-GCM.
- **Secure Sessions**: Integrated with **Better-Auth** for robust user authentication (Email/Password & Social).
- **Stateless Architecture**: Credentials are stored in secure, HTTP-only cookies, ensuring your keys never touch our persistent storage.

### 📁 Advanced File Explorer
- **Native Experience**: Breadcrumb navigation, folder simulation, and rich file-type icons.
- **Dual View Modes**: Switch between a detailed **List View** and a visual **Grid View**.
- **Context Actions**: Right-click (or 3-dot menu) for quick access to renaming, deleting, and sharing.
- **Optimistic UI**: Instant feedback on file operations with automatic server rollback on failure.

### 🖼️ Universal Previews
- **Instant Viewing**: Preview files without downloading.
- **Supported Formats**:
  - **Images**: High-quality image viewer.
  - **PDFs**: Embedded document viewer.
  - **Code/Text**: Interactive viewer with syntax-friendly formatting (JS, TS, Python, JSON, etc.).

### ⚙️ User Customization
- **Persistent Preferences**: Save your preferred view mode and items per page in your profile.
- **Smart Pagination**: Server-side pagination handles large buckets (thousands of objects) with ease.
- **Sorting**: Toggle between newest and oldest files at a glance.

### ⚡ Performance Optimized
- **Scalable Listing**: Uses S3 `ContinuationToken` for efficient paged fetching.
- **ACL Batching**: Concurrency-limited processing to prevent socket capacity issues.
- **Cloudflare Ready**: Built for the edge with **OpenNext** and Cloudflare Workers.

## 🛠️ Tech Stack
- **Framework**: Next.js (App Router)
- **Runtime**: Cloudflare Workers / Pages
- **Styling**: Tailwind CSS
- **Authentication**: Better-Auth
- **S3 Interaction**: AWS S3 SDK v3
- **Language**: TypeScript
- **Package Manager**: Bun

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh) installed.
- An AWS Account with S3 access.
- A Cloudflare account for deployment.

### Environment Variables
Create a `.env.local` file with the following:
```env
# Better Auth
BETTER_AUTH_SECRET=your_auth_secret
BETTER_AUTH_URL=http://localhost:3000

# Encryption
ENCRYPTION_KEY=your_32_character_hex_key

# Database (for Auth)
DATABASE_URL=file:./dev.db
```

### Installation
1. Install dependencies:
   ```bash
   bun install
   ```
2. Run development server:
   ```bash
   bun dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) and connect your S3 credentials.

## 📦 Deployment
Deploy to Cloudflare using OpenNext:
```bash
bun run deploy
```

---
Built with ❤️ for the edge.
