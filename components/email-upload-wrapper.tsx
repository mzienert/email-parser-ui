"use client";

import { useState } from "react";
import { EmailUploadForm } from "@/components/email-upload-form";
import { CloudWatchLogsViewer } from "@/components/cloudwatch-logs-viewer";

export function EmailUploadWrapper() {
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);

  const handleUploadSuccess = (fileId: string) => {
    console.log('Upload successful:', fileId);
    setUploadedFileId(fileId);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    // TODO: Handle error appropriately
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
      {/* Left Column - Upload Form (40%) */}
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-xl font-semibold">Upload Email</h2>
        <EmailUploadForm
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />
      </div>
      
      {/* Right Column - Log Viewer (60%) */}
      <div className="lg:col-span-3 space-y-4">
        <h2 className="text-xl font-semibold">Processing Logs</h2>
        <CloudWatchLogsViewer
          emailId={uploadedFileId || undefined}
          isVisible={true}
        />
      </div>
    </div>
  );
} 