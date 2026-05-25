import { useState, useCallback } from 'react';
import { Clipboard, BarChart3, FileText } from 'lucide-react';
import { SUMMARY_COLS } from '@/types';
import type { EBISData } from '@/types';

interface DataTablesProps {
  data: EBISData[];
  headers: string[];
  filteredData: EBISData[];
  onToast: (msg: string) => void;
}

export function DataTables({ data, headers, filteredData, onToast }: DataTablesProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'full'>('summary');

  const formatEBISDate = useCallback((raw: string): string => {
    if (!raw) return '';
    const [datePart, timePart] = raw.split(' ');
    if (!datePart || !timePart) return raw;
    const [y, m, d] = datePart.split('-');
    const [hh, mm] = timePart.split(':');
    return `${d}/${m}/${y} ${hh}:${mm}`;
  }, []);

  const copyAll = useCallback(() => {
    let result = '';
    filteredData.forEach(row => {
      const rowData = [
        formatEBISDate(row['LAST UPDATE STATUS'] || ''),
        '',
        row['ORDER'] || '',
        row['INTERNET'] || '',
        row['TYPE TRANSAKSI'] || '',
        '',
        row['ALAMAT'] || '',
        row['NAMA CUST'] || '',
        row['STO'] || '',
        '',
        'EBIS',
      ];
      result += rowData.join('\t') + '\n';
    });
    navigator.clipboard.writeText(result.trim()).then(() => {
      onToast('✅ DATA EBIS BERHASIL DICOPY!');
    }).catch(() => {
      onToast('❌ Gagal copy data');
    });
  }, [filteredData, formatEBISDate, onToast]);

  const copyColumn = useCallback((colName: string) => {
    const idx = SUMMARY_COLS.indexOf(colName);
    if (idx === -1) return;
    let text = '';
    filteredData.forEach(row => {
      const val = colName === 'ORDER' && row[colName]
        ? 'SC' + row[colName]
        : (row[colName] || '');
      text += val + '\n';
    });
    navigator.clipboard.writeText(text.trim()).then(() => {
      onToast(`Kolom ${colName} berhasil dicopy!`);
    });
  }, [filteredData, onToast]);

  const copyFromHere = useCallback((startRow: number, colName: string) => {
    let text = '';
    for (let i = startRow; i < filteredData.length; i++) {
      const val = colName === 'ORDER' && filteredData[i][colName]
        ? 'SC' + filteredData[i][colName]
        : (filteredData[i][colName] || '');
      text += val + '\n';
    }
    navigator.clipboard.writeText(text.trim()).then(() => {
      onToast('Dicopy dari baris ini ke bawah!');
    });
  }, [filteredData, onToast]);

  return (
    <div className="pixel-card p-5 mb-6">
      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setActiveTab('summary')}
          className={`pixel-btn px-4 py-2 text-lg flex items-center gap-2 ${
            activeTab === 'summary'
              ? 'bg-[#ef4444] text-white border-black shadow-[4px_4px_0px_#000]'
              : 'bg-transparent text-black border-transparent'
          }`}
        >
          <BarChart3 size={18} /> RINGKASAN
          <span className={`ml-1 px-2 py-0.5 text-xs border border-black bg-white text-black`}>
            {filteredData.length} / {data.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('full')}
          className={`pixel-btn px-4 py-2 text-lg flex items-center gap-2 ${
            activeTab === 'full'
              ? 'bg-[#ef4444] text-white border-black shadow-[4px_4px_0px_#000]'
              : 'bg-transparent text-black border-transparent'
          }`}
        >
          <FileText size={18} /> FULL DATA
          <span className={`ml-1 px-2 py-0.5 text-xs border border-black bg-white text-black`}>
            {filteredData.length} / {data.length}
          </span>
        </button>
      </div>

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div>
          <button
            onClick={copyAll}
            className="pixel-btn w-full mb-3 px-4 py-2 bg-[#4ade80] text-black text-lg flex items-center justify-center gap-2"
          >
            <Clipboard size={18} /> COPY SEMUA DATA KE CLIPBOARD
          </button>

          <div className="pixel-table-wrap">
            <table className="pixel-table">
              <thead>
                <tr>
                  {SUMMARY_COLS.map(col => (
                    <th
                      key={col}
                      onClick={() => copyColumn(col)}
                      className="cursor-pointer hover:bg-[#2563eb]"
                      title="Klik untuk copy kolom"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {SUMMARY_COLS.map((col) => (
                      <td
                        key={col}
                        onClick={() => copyFromHere(rowIdx, col)}
                        className="cursor-pointer"
                        title="Klik untuk copy dari baris ini ke bawah"
                      >
                        {col === 'ORDER' && row[col] ? 'SC' + row[col] : (row[col] || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Full Data Tab */}
      {activeTab === 'full' && (
        <div className="pixel-table-wrap">
          <table className="pixel-table">
            <thead>
              <tr>
                {headers.map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {headers.map(h => (
                    <td key={h}>{row[h] || ''}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
