"use client";

import { EmailUploadForm } from "@/components/email-upload-form";

export function EmailUploadWrapper() {
  const handleUploadSuccess = (fileId: string) => {
    console.log('Upload successful:', fileId);
    // TODO: Navigate to results page or show processing status
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    // TODO: Handle error appropriately
  };

  return (
    <EmailUploadForm
      onUploadSuccess={handleUploadSuccess}
      onUploadError={handleUploadError}
    />
  );
} 