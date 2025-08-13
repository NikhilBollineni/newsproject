import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
  className?: string;
}

export default function FileUpload({ 
  onFileSelect, 
  accept = ".pdf,.txt,.doc,.docx", 
  maxSize = 10 * 1024 * 1024, // 10MB
  className 
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    if (file.size > maxSize) {
      alert(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
      return;
    }
    
    setSelectedFile(file);
    onFileSelect(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
        data-testid="input-file"
      />
      
      {!selectedFile ? (
        <Card
          className={cn(
            "border-2 border-dashed transition-colors cursor-pointer",
            isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
          data-testid="card-file-upload"
        >
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Upload className="w-10 h-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Drop your file here</h3>
            <p className="text-muted-foreground mb-4">
              Supports PDF, TXT, DOC, and DOCX files up to {maxSize / (1024 * 1024)}MB
            </p>
            <Button variant="outline" data-testid="button-browse">
              Browse Files
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card data-testid="card-selected-file">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <File className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium" data-testid="text-filename">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground" data-testid="text-filesize">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={clearFile} data-testid="button-remove-file">
              <X className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
