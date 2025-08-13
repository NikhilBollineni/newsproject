import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import FileUpload from "@/components/ui/file-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Bot, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { documentsApi } from "@/lib/api";
import { Document } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function DocumentAnalysis() {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['/api/documents'],
    queryFn: documentsApi.getDocuments,
    staleTime: 5 * 60 * 1000,
  });

  const uploadMutation = useMutation({
    mutationFn: documentsApi.uploadDocument,
    onSuccess: (document) => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setSelectedDocument(document);
      toast({
        title: "Document uploaded successfully",
        description: "AI analysis will begin shortly.",
      });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: (id: string) => documentsApi.analyzeDocument(id),
    onSuccess: (analysis, documentId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      // Update selected document with analysis
      const updatedDoc = documents.find(d => d.id === documentId);
      if (updatedDoc) {
        setSelectedDocument({ ...updatedDoc, aiAnalysis: analysis });
      }
      toast({
        title: "Analysis complete",
        description: "AI analysis has been generated for your document.",
      });
    },
    onError: () => {
      toast({
        title: "Analysis failed",
        description: "Failed to analyze document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (file: File) => {
    uploadMutation.mutate(file);
  };

  const handleAnalyze = (documentId: string) => {
    analyzeMutation.mutate(documentId);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Document Analysis"
        subtitle="Upload and analyze documents with AI-powered insights"
      />
      
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Upload and Document List */}
          <div className="space-y-6">
            {/* File Upload */}
            <Card data-testid="card-file-upload">
              <CardHeader>
                <CardTitle>Upload Document</CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload 
                  onFileSelect={handleFileUpload}
                  accept=".pdf,.txt,.doc,.docx"
                  maxSize={10 * 1024 * 1024}
                />
                {uploadMutation.isPending && (
                  <div className="mt-4 flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Uploading document...</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents List */}
            <Card data-testid="card-documents-list">
              <CardHeader>
                <CardTitle>Recent Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : documents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8" data-testid="text-no-documents">
                    No documents uploaded yet. Upload your first document to get started.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {documents.map((document) => (
                      <div
                        key={document.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedDocument?.id === document.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedDocument(document)}
                        data-testid={`item-document-${document.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <FileText className="w-4 h-4 text-primary" />
                              <span className="font-medium truncate" data-testid={`text-document-name-${document.id}`}>
                                {document.originalName}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <span data-testid={`text-document-size-${document.id}`}>
                                {formatFileSize(document.size)}
                              </span>
                              <span>•</span>
                              <span data-testid={`text-document-date-${document.id}`}>
                                {formatDate(document.uploadedAt)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {document.aiAnalysis ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Analyzed
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAnalyze(document.id);
                                }}
                                disabled={analyzeMutation.isPending || !document.content}
                                data-testid={`button-analyze-${document.id}`}
                              >
                                <Bot className="w-3 h-3 mr-1" />
                                Analyze
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Analysis Results */}
          <div>
            <Card className="h-full" data-testid="card-analysis-results">
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent className="h-full overflow-y-auto">
                {selectedDocument ? (
                  <div className="space-y-6">
                    {/* Document Info */}
                    <div>
                      <h3 className="font-semibold mb-2" data-testid="text-selected-document-name">
                        {selectedDocument.originalName}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span data-testid="text-selected-document-size">
                          {formatFileSize(selectedDocument.size)}
                        </span>
                        <span data-testid="text-selected-document-type">
                          {selectedDocument.mimeType}
                        </span>
                        <span data-testid="text-selected-document-uploaded">
                          {formatDate(selectedDocument.uploadedAt)}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    {/* Analysis Status */}
                    {analyzeMutation.isPending ? (
                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="w-4 h-4 animate-spin text-primary" />
                        <span data-testid="text-analyzing">Analyzing document with AI...</span>
                      </div>
                    ) : selectedDocument.aiAnalysis ? (
                      <div className="space-y-6">
                        {/* Summary */}
                        <div data-testid="section-summary">
                          <h4 className="font-semibold mb-2">Summary</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {selectedDocument.aiAnalysis.summary}
                          </p>
                        </div>

                        {/* Key Insights */}
                        {selectedDocument.aiAnalysis.keyInsights?.length > 0 && (
                          <div data-testid="section-key-insights">
                            <h4 className="font-semibold mb-2">Key Insights</h4>
                            <ul className="space-y-2">
                              {selectedDocument.aiAnalysis.keyInsights.map((insight: string, index: number) => (
                                <li key={index} className="flex items-start space-x-2 text-sm">
                                  <span className="text-primary mt-1">•</span>
                                  <span className="text-muted-foreground">{insight}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Recommendations */}
                        {selectedDocument.aiAnalysis.recommendations?.length > 0 && (
                          <div data-testid="section-recommendations">
                            <h4 className="font-semibold mb-2">Recommendations</h4>
                            <ul className="space-y-2">
                              {selectedDocument.aiAnalysis.recommendations.map((rec: string, index: number) => (
                                <li key={index} className="flex items-start space-x-2 text-sm">
                                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                  <span className="text-muted-foreground">{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Industry Impact */}
                        {selectedDocument.aiAnalysis.industryImpact && (
                          <div data-testid="section-industry-impact">
                            <h4 className="font-semibold mb-2">Industry Impact</h4>
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-start space-x-2">
                                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                                <p className="text-sm text-blue-800">
                                  {selectedDocument.aiAnalysis.industryImpact}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Bot className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="font-semibold mb-2">Ready for AI Analysis</h3>
                        <p className="text-muted-foreground mb-4">
                          Click "Analyze" to generate AI-powered insights for this document.
                        </p>
                        {selectedDocument.content && (
                          <Button
                            onClick={() => handleAnalyze(selectedDocument.id)}
                            disabled={analyzeMutation.isPending}
                            data-testid="button-start-analysis"
                          >
                            <Bot className="w-4 h-4 mr-2" />
                            Start Analysis
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Select a Document</h3>
                    <p className="text-muted-foreground" data-testid="text-select-document">
                      Choose a document from the list to view its analysis results.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
