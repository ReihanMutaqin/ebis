import { useState, useRef, useCallback } from 'react';
import { Upload, Download, FolderOpen, CheckCircle } from 'lucide-react';
import { DuckAnimation } from './DuckAnimation';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  hasFile?: boolean;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const [dragOver, setDragOver]       = useState(false);
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
    const yyyy = today.getFullYear();
    const mm   = String(today.getMonth() + 1).padStart(2, '0');
    const dd   = String(today.getDate()).padStart(2, '0');
    const tanggalAwal  = `${yyyy}${mm}01`;
    const tanggalAkhir = `${yyyy}${mm}${dd}`;
    const url = `https://xpro.telkom.co.id/hsi/detail-home/TOT_ORDER/2/JAKARTA%20OUTER/ALL/ALL/STO/ALL/all/ALL/undefined/ALL/all/ALL/all/ALL/${tanggalAwal}/${tanggalAkhir}/true`;
    window.open(url, '_blank');
  }, []);

  return (
    <div className="pixel-card p-5 mb-5">
      <DuckAnimation />

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.csv"
        onChange={handleChange}
        className="hidden"
      />

      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className="border-4 border-dashed text-center p-8 cursor-pointer transition-all duration-200 font-vt select-none"
        style={{
          borderColor:     dragOver ? '#3b82f6' : '#000',
          backgroundColor: dragOver ? '#dbeafe' : (selectedFile ? '#f0fdf4' : '#f0f9ff'),
          transform: dragOver ? 'scale(1.015)' : 'scale(1)',
        }}
        id="dropzone"
      >
        {selectedFile ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle size={42} className="text-green-500" />
            <p className="font-bold text-xl text-gray-800">{selectedFile.name}</p>
            <p className="text-base text-gray-500">SIZE: {(selectedFile.size / 1024).toFixed(1)} KB</p>
            <span className="inline-block bg-green-500 text-white px-3 py-1 text-base font-bold border-2 border-black">
              ✔ SIAP DIPROSES
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <FolderOpen size={48} className="text-blue-500" />
            <p className="text-2xl font-bold text-gray-800">DROP FILE DISINI</p>
            <p className="text-base text-gray-500">Atau klik untuk pilih file EBIS (.txt / .csv)</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-4 justify-center flex-wrap">
        <button
          onClick={handleUploadClick}
          disabled={!selectedFile}
          id="btn-upload"
          className="pixel-btn px-6 py-2.5 bg-[#3b82f6] text-white text-xl disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
        >
          <Upload size={18} /> UPLOAD FILE
        </button>

        <button
          onClick={handleDownload}
          id="btn-download"
          className="pixel-btn px-6 py-2.5 bg-[#22c55e] text-black text-xl"
        >
          <Download size={18} /> DOWNLOAD DATA
        </button>
      </div>
    </div>
  );
}
