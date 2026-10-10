'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderArchive,
  FileText,
  UploadCloud,
  Trash2,
  Eye,
  FileSpreadsheet,
  File,
  CheckCircle2,
  Calendar,
  X,
} from 'lucide-react';
import { DocumentRecord } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface DocumentLibraryProps {
  initialDocuments: DocumentRecord[];
}

export const DocumentLibrary: React.FC<DocumentLibraryProps> = ({ initialDocuments }) => {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentRecord[]>(initialDocuments);
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, ''));

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      const newDoc = await res.json();
      if (res.ok) {
        setDocuments((prev) => [newDoc, ...prev]);
        router.refresh();
      } else {
        alert(newDoc.error || 'Failed to upload document.');
      }
    } catch {
      alert('Upload error occurred.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document from the library?')) return;
    setDeletingId(id);

    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        if (previewDoc?.id === id) setPreviewDoc(null);
        router.refresh();
      } else {
        alert('Failed to delete document.');
      }
    } catch {
      alert('Error connecting to server.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'csv':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-600" />;
      default:
        return <File className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Upload Section */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Financial Document Library</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Securely stored financial statements, audit reports, earnings transcripts, and regulatory filings.
            </p>
          </div>

          <div>
            <input
              type="file"
              id="library-upload"
              accept=".pdf,.docx,.txt,.csv"
              className="hidden"
              onChange={handleFileUpload}
            />
            <label htmlFor="library-upload">
              <Button
                variant="primary"
                size="sm"
                isLoading={isUploading}
                leftIcon={<UploadCloud className="w-4 h-4" />}
                onClick={() => {}}
                className="cursor-pointer"
              >
                Upload Document
              </Button>
            </label>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {documents.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FolderArchive className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No documents in vault</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Upload PDF, DOCX, CSV, or TXT files to parse and store them for multi-dimensional intelligence analysis.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-brand-border bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Document Title</th>
                    <th className="py-3 px-4">Format</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Word Count</th>
                    <th className="py-3 px-4">Date Uploaded</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/60">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-brand-text-primary">
                        <div className="flex items-center gap-2.5">
                          {getFileIcon(doc.fileType)}
                          <span className="truncate max-w-xs">{doc.title}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono uppercase text-slate-600">
                        {doc.fileType}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatFileSize(doc.fileSizeBytes)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-mono">
                        {doc.wordCount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDate(doc.createdAt)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200">
                          {doc.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 rounded text-slate-500 hover:text-brand-navy hover:bg-slate-100"
                            title="Preview Extracted Text"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            disabled={deletingId === doc.id}
                            className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                            title="Delete Document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Text Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col border border-brand-border">
            <div className="p-4 border-b border-brand-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-brand-text-primary">{previewDoc.title}</h3>
                <p className="text-xs text-slate-400">{previewDoc.filename} ({previewDoc.wordCount} words)</p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap bg-slate-50">
              {previewDoc.extractedText}
            </div>
            <div className="p-3 border-t border-brand-border bg-slate-50 text-right">
              <Button size="sm" variant="outline" onClick={() => setPreviewDoc(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
