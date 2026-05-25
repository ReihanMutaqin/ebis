import { Save } from 'lucide-react';
import type { FileInfo } from '@/types';

interface DataInfoProps {
  info: FileInfo;
}

export function DataInfo({ info }: DataInfoProps) {
  return (
    <div className="pixel-card p-5 mb-6" style={{ background: '#fff8e1' }}>
      <h4 className="font-bold text-xl border-b-[3px] border-black pb-2 mb-4 flex items-center gap-2 font-vt">
        <Save size={22} /> INFORMASI DATA
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center font-vt text-lg">
        <div className="lg:border-r-2 lg:border-black">
          <p className="font-bold text-base">NAMA FILE</p>
          <p className="truncate px-2">{info.name}</p>
        </div>
        <div className="lg:border-r-2 lg:border-black">
          <p className="font-bold text-base">WAKTU</p>
          <p>{info.time}</p>
        </div>
        <div className="lg:border-r-2 lg:border-black">
          <p className="font-bold text-base">UKURAN</p>
          <p>{info.size}</p>
        </div>
        <div>
          <p className="font-bold text-base">TOTAL BARIS</p>
          <span className="inline-block bg-[#ef4444] text-white px-3 py-1 font-pixel text-sm">
            {info.rows}
          </span>
        </div>
      </div>
    </div>
  );
}
