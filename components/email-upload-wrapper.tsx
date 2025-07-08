"use client";

import { useState } from "react";
import { EmailUploadForm } from "@/components/email-upload-form";
import { CloudWatchLogsViewer } from "@/components/cloudwatch-logs-viewer";

export function EmailUploadWrapper() {
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  const handleUploadSuccess = (fileId: string) => {
    console.log('Upload successful:', fileId);
    setUploadedFileId(fileId);
    setShowLogs(true);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    // TODO: Handle error appropriately
  };

  return (
    <div className="space-y-6">
      <EmailUploadForm
        onUploadSuccess={handleUploadSuccess}
        onUploadError={handleUploadError}
      />
      
      {uploadedFileId && (
        <CloudWatchLogsViewer
          emailId={uploadedFileId}
          isVisible={showLogs}
        />
      )}
    </div>
  );
} 