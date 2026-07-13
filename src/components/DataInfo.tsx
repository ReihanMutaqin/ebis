import { Database } from 'lucide-react';
import type { FileInfo } from '@/types';

interface DataInfoProps {
  info: FileInfo;
}

export function DataInfo({ info }: DataInfoProps) {
  return (
    <div className="pro-card p-4 mb-5">
      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700/60 pb-2.5 mb-3 flex items-center gap-2">
        <Database size={15} className="text-blue-500" />
        Informasi Data
      </h4>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-center">
        {[
          { label: 'Nama File',    value: info.name,         truncate: true },
          { label: 'Waktu Parse', value: info.time,         truncate: false },
          { label: 'Ukuran',       value: info.size,         truncate: false },
          { label: 'Total Baris',  value: String(info.rows), badge: true },
        ].map(({ label, value, truncate, badge }) => (
          <div
            key={label}
            className="bg-gray-50 dark:bg-[#0a1626] rounded-lg px-3 py-3 border border-gray-100 dark:border-[#1e2d45]"
          >
            <p className="pro-section-title mb-1.5">
              {label}
            </p>
            {badge ? (
              <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                {value}
              </span>
            ) : (
              <p className={`text-sm font-semibold text-gray-800 dark:text-gray-200 ${truncate ? 'truncate' : ''}`}>
                {value}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
