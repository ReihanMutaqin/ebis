import { useState, useCallback } from 'react';
import { Clipboard, BarChart3, FileText, Copy } from 'lucide-react';
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

  const buildRowText = useCallback((row: EBISData): string => {
    const rowData = [
      formatEBISDate(row['LAST UPDATE STATUS'] || ''),
      '',
      row['ORDER'] ? 'SC' + row['ORDER'] : '',
      row['INTERNET'] || '',
      row['TYPE TRANSAKSI'] || '',
      '',
      row['ALAMAT'] || '',
      row['NAMA CUST'] || '',
      row['STO'] || '',
      '',
      'EBIS',
    ];
    return rowData.join('\t');
  }, [formatEBISDate]);

  const copyAll = useCallback(() => {
    const result = filteredData.map(row => buildRowText(row)).join('\n');
    navigator.clipboard.writeText(result.trim()).then(() => {
      onToast('✅ DATA EBIS BERHASIL DICOPY!');
    }).catch(() => {
      onToast('❌ Gagal copy data');
    });
  }, [filteredData, buildRowText, onToast]);

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
      onToast(`📋 Kolom "${colName}" berhasil dicopy!`);
    });
  }, [filteredData, onToast]);

  const copyRow = useCallback((rowIdx: number) => {
    const row = filteredData[rowIdx];
    if (!row) return;
    const text = buildRowText(row);
    navigator.clipboard.writeText(text).then(() => {
      onToast('✅ 1 Baris EBIS berhasil dicopy!');
    }).catch(() => {
      onToast('❌ Gagal copy baris');
    });
  }, [filteredData, buildRowText, onToast]);

  const tabClass = (tab: 'summary' | 'full') =>
    `pixel-btn px-4 py-2 text-lg flex items-center gap-2 ${
      activeTab === tab
        ? 'bg-[#ef4444] text-white border-black shadow-[4px_4px_0px_#000]'
        : 'bg-white dark:bg-[#0f2744] text-black dark:text-gray-300 border-black/40'
    }`;

  return (
    <div className="pixel-card p-5 mb-6">

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button id="tab-summary" onClick={() => setActiveTab('summary')} className={tabClass('summary')}>
          <BarChart3 size={17} />
          RINGKASAN
          <span className="ml-1 px-2 py-0.5 text-xs border border-black bg-white text-black">
            {filteredData.length} / {data.length}
          </span>
        </button>

        <button id="tab-full" onClick={() => setActiveTab('full')} className={tabClass('full')}>
          <FileText size={17} />
          FULL DATA
          <span className="ml-1 px-2 py-0.5 text-xs border border-black bg-white text-black">
            {filteredData.length} / {data.length}
          </span>
        </button>
      </div>

      {/* ── Summary Tab ── */}
      {activeTab === 'summary' && (
        <div>
          {/* Copy all button */}
          <button
            id="btn-copy-all"
            onClick={copyAll}
            className="pixel-btn w-full mb-4 px-4 py-2.5 bg-[#22c55e] text-black text-xl justify-center"
          >
            <Clipboard size={18} />
            COPY SEMUA DATA KE CLIPBOARD
            <span className="ml-2 px-2 py-0.5 text-sm border border-black bg-white">
              {filteredData.length} baris
            </span>
          </button>

          {/* Helper hint */}
          <div className="flex gap-4 mb-3 text-sm font-vt text-gray-500 dark:text-gray-400 flex-wrap">
            <span className="flex items-center gap-1">
              <Copy size={13} className="text-blue-500" />
              Klik <strong>header kolom</strong> → copy seluruh kolom
            </span>
            <span className="flex items-center gap-1">
              <Copy size={13} className="text-green-500" />
              Klik <strong>isi baris</strong> → copy 1 baris penuh (format EBIS)
            </span>
          </div>

          <div className="pixel-table-wrap">
            <table className="pixel-table">
              <thead>
                <tr>
                  <th className="w-8 text-center cursor-default">#</th>
                  {SUMMARY_COLS.map(col => (
                    <th
                      key={col}
                      onClick={() => copyColumn(col)}
                      title={`Klik untuk copy kolom "${col}"`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={SUMMARY_COLS.length + 1}
                      className="text-center py-8 text-gray-400 italic"
                    >
                      Tidak ada data yang sesuai filter
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      <td className="text-center text-gray-400 text-sm select-none">
                        {rowIdx + 1}
                      </td>
                      {SUMMARY_COLS.map((col) => (
                        <td
                          key={col}
                          onClick={() => copyRow(rowIdx)}
                          title="Klik untuk copy 1 baris ini (format EBIS)"
                        >
                          {col === 'ORDER' && row[col] ? 'SC' + row[col] : (row[col] || '')}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Full Data Tab ── */}
      {activeTab === 'full' && (
        <div>
          {filteredData.length === 0 ? (
            <p className="text-center py-8 text-gray-400 italic font-vt">
              Tidak ada data yang sesuai filter
            </p>
          ) : (
            <div className="pixel-table-wrap">
              <table className="pixel-table">
                <thead>
                  <tr>
                    <th className="w-8 text-center cursor-default">#</th>
                    {headers.map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      <td className="text-center text-gray-400 text-sm select-none">
                        {rowIdx + 1}
                      </td>
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
      )}
    </div>
  );
}
