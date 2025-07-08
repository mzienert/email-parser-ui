"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";

interface UploadFormProps {
  onUploadSuccess?: (fileId: string) => void;
  onUploadError?: (error: string) => void;
}

export function EmailUploadForm({ onUploadSuccess, onUploadError }: UploadFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith('.eml') && !file.name.endsWith('.msg') && !file.name.endsWith('.txt')) {
        setUploadStatus('error');
        setUploadMessage('Please select an email file (.eml, .msg, or .txt)');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadStatus('error');
        setUploadMessage('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
      setUploadStatus('idle');
      setUploadMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStatus('idle');
    setUploadMessage('');

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = selectedFile.name.split('.').pop();
      const filename = `email-${timestamp}.${fileExtension}`;
      
      // Upload to S3
      const s3Url = `https://email-parsing-mvp-619326977873-us-west-2.s3.us-west-2.amazonaws.com/emails/${filename}`;
      
      const response = await fetch(s3Url, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type || 'application/octet-stream',
        },
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
      
      // Success!
      const fileId = filename.replace(`.${fileExtension}`, '');
      setUploadStatus('success');
      setUploadMessage('Email uploaded successfully! Processing will begin automatically.');
      onUploadSuccess?.(fileId);
      
      // Reset form
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadMessage(error instanceof Error ? error.message : 'Upload failed. Please try again.');
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      // Validate file type
      if (!file.name.endsWith('.eml') && !file.name.endsWith('.msg') && !file.name.endsWith('.txt')) {
        setUploadStatus('error');
        setUploadMessage('Please select an email file (.eml, .msg, or .txt)');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadStatus('error');
        setUploadMessage('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
      setUploadStatus('idle');
      setUploadMessage('');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Email for Processing
        </CardTitle>
        <CardDescription>
          Upload an email file (.eml, .msg, or .txt) to extract requirements and find matching suppliers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Area */}
        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-muted rounded-full">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Drag and drop your email file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports .eml, .msg, and .txt files up to 10MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".eml,.msg,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Browse Files
            </Button>
          </div>
        </div>

        {/* Selected File Info */}
        {selectedFile && (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              variant="ghost"
              size="sm"
            >
              Remove
            </Button>
          </div>
        )}

        {/* Upload Status */}
        {uploadStatus !== 'idle' && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            uploadStatus === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {uploadStatus === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <p className="text-sm">{uploadMessage}</p>
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Processing Upload...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload and Process Email
            </>
          )}
        </Button>

        {/* Info */}
        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
          <p className="font-medium mb-1">What happens automatically after upload:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Email is uploaded to secure AWS S3 storage</li>
            <li>Lambda function triggers AI processing (Claude 3.7 Sonnet)</li>
            <li>AI extracts requirements and specifications</li>
            <li>System matches against supplier database</li>
            <li>Results become available via API (typically 5-7 seconds)</li>
          </ol>
          <p className="mt-2 text-xs">
            <strong>Note:</strong> Processing happens automatically - you can check results using the file ID.
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 