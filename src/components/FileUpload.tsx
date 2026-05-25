import { useState, useRef, useCallback } from 'react';
import { Upload, Download, FolderOpen } from 'lucide-react';
import { DuckAnimation } from './DuckAnimation';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  hasFile?: boolean;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
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
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  }, [selectedFile, onFileSelect]);

  const handleDownload = useCallback(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const tanggalAwal = `${yyyy}${mm}01`;
    const tanggalAkhir = `${yyyy}${mm}${dd}`;
    const url = `https://xpro.telkom.co.id/hsi/detail-home/TOT_ORDER/2/JAKARTA%20OUTER/ALL/ALL/STO/ALL/all/ALL/undefined/ALL/all/ALL/all/ALL/${tanggalAwal}/${tanggalAkhir}/true`;
    window.open(url, '_blank');
  }, []);

  return (
    <div className="pixel-card p-5 mb-6">
      <DuckAnimation />

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.csv"
        onChange={handleChange}
        className="hidden"
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className="border-4 border-dashed border-black text-center p-10 cursor-pointer transition-all duration-200 font-vt"
        style={{
          backgroundColor: dragOver ? '#bae6fd' : '#e0f2fe',
          transform: dragOver ? 'scale(1.02)' : 'scale(1)',
        }}
      >
        {selectedFile ? (
          <div className="border-2 border-black p-3 bg-white">
            <p className="font-bold text-xl">{selectedFile.name}</p>
            <p className="text-base text-gray-600">SIZE: {(selectedFile.size / 1024).toFixed(1)} KB</p>
            <p className="text-green-600 font-bold">✔ READY TO UPLOAD</p>
          </div>
        ) : (
          <div>
            <FolderOpen size={48} className="mx-auto mb-2 text-black" />
            <p className="text-2xl font-bold">DROP FILE DISINI</p>
            <p className="text-base">(Masukin File EBIS yang udah di Download)</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-4 justify-center flex-wrap">
        <button
          onClick={handleUploadClick}
          disabled={!selectedFile}
          className="pixel-btn px-6 py-3 bg-[#3b82f6] text-white text-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload size={20} /> UPLOAD FILE
        </button>

        <button
          onClick={handleDownload}
          className="pixel-btn px-6 py-3 bg-[#4ade80] text-black text-xl flex items-center gap-2"
        >
          <Download size={20} /> DOWNLOAD DATA (BETA)
        </button>
      </div>
    </div>
  );
}
