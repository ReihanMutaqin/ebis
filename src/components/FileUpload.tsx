import { useState, useRef, useCallback } from 'react';
import { Upload, Download, FolderOpen, CheckCircle, FileText } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  hasFile?: boolean;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const [dragOver, setDragOver]         = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setSelectedFile(file);
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleUploadClick = useCallback(() => {
    if (selectedFile) onFileSelect(selectedFile);
  }, [selectedFile, onFileSelect]);

  const handleDownload = useCallback(() => {
    const today = new Date();
    const yyyy  = today.getFullYear();
    const mm    = String(today.getMonth() + 1).padStart(2, '0');
    const dd    = String(today.getDate()).padStart(2, '0');
    const tanggalAwal  = `${yyyy}${mm}01`;
    const tanggalAkhir = `${yyyy}${mm}${dd}`;
    const url = `https://xpro.telkom.co.id/hsi/detail-home/TOT_ORDER/2/ALL/ALL/ALL/STO/ALL/NEW%20SALES/ALL/undefined/ALL/all/ALL/all/ALL/${tanggalAwal}/${tanggalAkhir}/true`;
    window.open(url, '_blank');
  }, []);

  return (
    <div className="pro-card p-6 mb-5">
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.csv,.xls,.xlsx"
        onChange={handleChange}
        className="hidden"
      />

      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`rounded-xl text-center p-8 cursor-pointer transition-all duration-200 select-none border-2 border-dashed ${
          dragOver 
            ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-500/10' 
            : selectedFile 
              ? 'border-green-600 bg-green-50 dark:border-green-500 dark:bg-green-500/10' 
              : 'border-slate-300 bg-slate-50 dark:border-[#2a3f5f] dark:bg-[#152033]'
        }`}
        id="dropzone"
      >
        {selectedFile ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-1">
              <CheckCircle size={30} className="text-green-600" />
            </div>
            <p className="font-semibold text-base text-gray-800 dark:text-gray-200">{selectedFile.name}</p>
            <p className="text-sm text-gray-500">Ukuran: {(selectedFile.size / 1024).toFixed(1)} KB</p>
            <span className="inline-block bg-green-100 text-green-700 border border-green-300 px-3 py-1 rounded-full text-xs font-semibold">
              ✓ Siap Diproses
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-1">
              <FolderOpen size={28} className="text-blue-500" />
            </div>
            <p className="font-semibold text-base text-gray-700 dark:text-gray-300">Seret file ke sini</p>
            <p className="text-sm text-gray-400">atau klik untuk pilih file EBIS (.xls / .txt)</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-4 justify-center flex-wrap">
        <button
          onClick={handleUploadClick}
          disabled={!selectedFile}
          id="btn-upload"
          className="pro-btn pro-btn-primary"
        >
          <Upload size={15} /> Upload File
        </button>

        <button
          onClick={handleDownload}
          id="btn-download"
          className="pro-btn pro-btn-success"
        >
          <Download size={15} /> Download Data EBIS
        </button>
      </div>

      {/* Info */}
      <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
        <FileText size={12} />
        Format yang didukung: .xls, .txt, .csv (data EBIS dari xpro.telkom.co.id)
      </p>
    </div>
  );
}
