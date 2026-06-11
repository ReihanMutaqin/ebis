import { Database } from 'lucide-react';
import type { FileInfo } from '@/types';

interface DataInfoProps {
  info: FileInfo;
}

export function DataInfo({ info }: DataInfoProps) {
  return (
    <div className="pixel-card p-4 mb-5">
      <h4 className="font-vt text-xl font-bold border-b-[3px] border-black dark:border-[#2a3a5a] pb-2 mb-4 flex items-center gap-2">
        <Database size={20} />
        INFORMASI DATA
      </h4>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-center font-vt">
        {[
          { label: 'NAMA FILE',   value: info.name,         truncate: true },
          { label: 'WAKTU',       value: info.time,         truncate: false },
          { label: 'UKURAN',      value: info.size,         truncate: false },
          { label: 'TOTAL BARIS', value: String(info.rows), badge: true },
        ].map(({ label, value, truncate, badge }) => (
          <div
            key={label}
            className="bg-gray-50 dark:bg-[#0f2744] border-2 border-black dark:border-[#2a3a5a] px-3 py-3"
          >
            <p className="text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400 mb-1 font-pixel" style={{ fontSize: '0.6rem' }}>
              {label}
            </p>
            {badge ? (
              <span className="inline-block bg-[#ef4444] text-white px-3 py-1 font-pixel text-sm border border-black">
                {value}
              </span>
            ) : (
              <p className={`text-lg font-bold text-gray-800 dark:text-gray-200 ${truncate ? 'truncate' : ''}`}>
                {value}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
