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
      onToast('✅ Data EBIS berhasil disalin ke clipboard!');
    }).catch(() => {
      onToast('❌ Gagal menyalin data');
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
      onToast(`📋 Kolom "${colName}" berhasil disalin!`);
    });
  }, [filteredData, onToast]);

  const copyRow = useCallback((rowIdx: number) => {
    const row = filteredData[rowIdx];
    if (!row) return;
    const text = buildRowText(row);
    navigator.clipboard.writeText(text).then(() => {
      onToast('✅ 1 baris berhasil disalin (format EBIS)!');
    }).catch(() => {
      onToast('❌ Gagal menyalin baris');
    });
  }, [filteredData, buildRowText, onToast]);

  const tabClass = (tab: 'summary' | 'full') =>
    `pro-btn flex items-center gap-2 !text-sm ${
      activeTab === tab
        ? 'pro-btn-primary'
        : 'pro-btn-ghost'
    }`;

  return (
    <div className="pro-card p-5 mb-6">

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button id="tab-summary" onClick={() => setActiveTab('summary')} className={tabClass('summary')}>
          <BarChart3 size={15} />
          Ringkasan
          <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-white/20 dark:bg-black/30">
            {filteredData.length} / {data.length}
          </span>
        </button>

        <button id="tab-full" onClick={() => setActiveTab('full')} className={tabClass('full')}>
          <FileText size={15} />
          Full Data
          <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
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
            className="pro-btn pro-btn-success w-full mb-4 justify-center !py-2.5"
          >
            <Clipboard size={16} />
            Salin Semua Data ke Clipboard
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white/20">
              {filteredData.length} baris
            </span>
          </button>

          {/* Helper hint */}
          <div className="flex gap-4 mb-3 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Copy size={11} className="text-blue-400" />
              Klik <strong className="text-gray-600 dark:text-gray-300">header kolom</strong> → salin seluruh kolom
            </span>
            <span className="flex items-center gap-1">
              <Copy size={11} className="text-green-400" />
              Klik <strong className="text-gray-600 dark:text-gray-300">isi baris</strong> → salin 1 baris (format EBIS)
            </span>
          </div>

          <div className="pro-table-wrap">
            <table className="pro-table">
              <thead>
                <tr>
                  <th className="w-8 text-center cursor-default">#</th>
                  {SUMMARY_COLS.map(col => (
                    <th
                      key={col}
                      onClick={() => copyColumn(col)}
                      title={`Klik untuk salin kolom "${col}"`}
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
                      <td className="text-center text-gray-400 text-xs select-none">
                        {rowIdx + 1}
                      </td>
                      {SUMMARY_COLS.map((col) => (
                        <td
                          key={col}
                          onClick={() => copyRow(rowIdx)}
                          title="Klik untuk salin 1 baris ini (format EBIS)"
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
            <p className="text-center py-8 text-gray-400 italic text-sm">
              Tidak ada data yang sesuai filter
            </p>
          ) : (
            <div className="pro-table-wrap">
              <table className="pro-table">
                <thead>
                  <tr>
                    <th className="w-8 text-center cursor-default">#</th>
                    {headers.map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      <td className="text-center text-gray-400 text-xs select-none">
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
