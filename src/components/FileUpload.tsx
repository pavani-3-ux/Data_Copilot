import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { classNames } from '../utils/helpers';
import { parseCSV, parseExcel, calculateDatasetStats, profileColumn } from '../utils/dataProcessing';
import type { Dataset, DatasetStats, DataProfile } from '../types';

interface FileUploadProps {
  onUploadComplete: (dataset: Dataset, stats: DatasetStats, profiles: DataProfile[], data: Record<string, unknown>[]) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

export default function FileUpload({ onUploadComplete, isProcessing, setIsProcessing }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension || !['csv', 'xlsx', 'xls'].includes(extension)) {
      return { isValid: false, error: 'Please upload a CSV or Excel file (.csv, .xlsx, .xls)' };
    }

    if (file.size > 50 * 1024 * 1024) {
      return { isValid: false, error: 'File size must be less than 50MB' };
    }

    return { isValid: true };
  };

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      const validation = validateFile(file);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid file');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  }, []);

  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateFile(file);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid file');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  }, []);

  const processFile = useCallback(async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Stage 1: Parsing
      setUploadStage('Parsing file...');
      setUploadProgress(20);

      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      const { data, columns } = extension === 'csv'
        ? await parseCSV(selectedFile)
        : await parseExcel(selectedFile);

      setUploadProgress(40);
      setUploadStage('Calculating statistics...');

      // Stage 2: Statistics
      const stats = calculateDatasetStats(data, columns);
      setUploadProgress(60);
      setUploadStage('Profiling columns...');

      // Stage 3: Column Profiling
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for UX
      const profiles: DataProfile[] = columns.map((col) =>
        profileColumn(data, col.name, col.type)
      );
      setUploadProgress(80);
      setUploadStage('Finalizing...');

      // Stage 4: Create dataset object
      const dataset: Dataset = {
        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        name: selectedFile.name,
        file_type: extension as 'csv' | 'xlsx' | 'xls',
        file_size: selectedFile.size,
        row_count: stats.totalRows,
        column_count: stats.totalColumns,
        columns,
        has_headers: true,
        status: 'ready',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setUploadProgress(100);
      setUploadStage('Complete!');

      await new Promise(resolve => setTimeout(resolve, 500));

      onUploadComplete(dataset, stats, profiles, data);
      setSelectedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
      setUploadStage('');
      setUploadProgress(0);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, onUploadComplete, setIsProcessing]);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    setUploadProgress(0);
    setUploadStage('');
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white">Upload Dataset</h1>
        <p className="text-secondary-400 mt-2">
          Upload a CSV or Excel file to start analyzing your data
        </p>
      </div>

      {/* Drop Zone */}
      <div
        className={classNames(
          'relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300',
          isDragging
            ? 'border-primary-500 bg-primary-500/10'
            : 'border-secondary-700 bg-secondary-900/50 hover:border-secondary-600 hover:bg-secondary-900'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isProcessing && (
          <div className="absolute inset-0 bg-secondary-900/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10">
            <Loader className="w-12 h-12 text-primary-500 animate-spin mb-4" />
            <p className="text-white font-medium">{uploadStage}</p>
            <div className="w-64 h-2 bg-secondary-700 rounded-full mt-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-secondary-400 text-sm mt-2">{uploadProgress}%</p>
          </div>
        )}

        <div className="text-center">
          <div className={classNames(
            'w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all',
            isDragging ? 'bg-primary-500/20' : 'bg-secondary-800'
          )}>
            <Upload className={classNames(
              'w-8 h-8 transition-colors',
              isDragging ? 'text-primary-400' : 'text-secondary-400'
            )} />
          </div>

          <p className="text-white font-medium mb-2">
            {isDragging ? 'Drop your file here' : 'Drag and drop your file here'}
          </p>
          <p className="text-secondary-400 text-sm mb-4">or</p>

          <label className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg cursor-pointer hover:shadow-glow transition-shadow">
            <FileSpreadsheet className="w-4 h-4" />
            <span className="text-sm font-medium">Browse Files</span>
            <input
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              disabled={isProcessing}
            />
          </label>

          <p className="text-secondary-500 text-xs mt-4">
            Supported formats: CSV, XLSX, XLS (max 50MB)
          </p>
        </div>
      </div>

      {/* Selected File Preview */}
      {selectedFile && !isProcessing && (
        <div className="mt-6 bg-secondary-900 rounded-xl border border-secondary-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-accent-400" />
              </div>
              <div>
                <p className="text-white font-medium">{selectedFile.name}</p>
                <p className="text-secondary-400 text-sm">
                  {formatFileSize(selectedFile.size)} &bull; {selectedFile.type || 'Spreadsheet'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={clearSelection}
                className="p-2 rounded-lg hover:bg-secondary-800 text-secondary-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={processFile}
                className="flex items-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Process File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 bg-error-500/10 border border-error-500/20 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-error-400 flex-shrink-0" />
          <p className="text-error-400 text-sm">{error}</p>
        </div>
      )}

      {/* Upload Tips */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-secondary-900/50 rounded-xl p-4 border border-secondary-800">
          <h3 className="text-white text-sm font-medium mb-2">Best Practices</h3>
          <p className="text-secondary-400 text-xs">
            Include headers in the first row for better data interpretation.
          </p>
        </div>
        <div className="bg-secondary-900/50 rounded-xl p-4 border border-secondary-800">
          <h3 className="text-white text-sm font-medium mb-2">Data Quality</h3>
          <p className="text-secondary-400 text-xs">
            Clean your data by removing empty rows and columns before upload.
          </p>
        </div>
        <div className="bg-secondary-900/50 rounded-xl p-4 border border-secondary-800">
          <h3 className="text-white text-sm font-medium mb-2">Format Tips</h3>
          <p className="text-secondary-400 text-xs">
            Use consistent date formats (YYYY-MM-DD) for accurate analysis.
          </p>
        </div>
      </div>
    </div>
  );
}
