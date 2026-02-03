# S3 Web Client Implementation

Need for a simple S3 web-based client that allows users to upload and download files to and from Amazon S3.
Upon start, the user logs in and inputs AWS S3 access key and secret.
These infos are saved and attached to that user so that the user doesn't have to input them every time.

## Tech stack

- Next.js (on Cloudflare)
- Tailwind CSS
- AWS S3 SDK
- Cloudflare Workers
- Better-Auth for authentication
- Bun for package management
- TypeScript

## Features

1. **Authentication and Security**:
   - Secure input for AWS S3 access key and secret.
   - Option to revoke or clear stored credentials.

2. **Bucket and File Management**:
   - Hierarchical view of buckets and folders.
   - File uploads with progress indicators.
   - File downloads with confirmation dialogs.
   - Renaming and deleting files/folders.

3. **File Context Menu**:
   - View public URL (if the file is publicly accessible).
   - Update file permissions (toggle between private and public).
   - Copy file path or public URL to clipboard.
   - Generate pre-signed URLs for temporary access.

4. **User Interface**:
   - Clean, responsive design compatible with desktop and mobile.
   - Modern UI framework using Tailwind CSS.

5. **Error Handling**:
   - Graceful handling of errors such as invalid credentials, missing permissions, or network issues.
   - Actionable feedback to the user.

6. **Advanced Features**:
   - Multi-file upload/download.
   - Drag-and-drop support for uploads.
   - Folder creation and management.
   - File preview (images, PDFs, text files).
   - Integration with AWS IAM roles.
