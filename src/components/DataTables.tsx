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
  const [activeTab, setActiveTab] = useState<'summary' | 'full' | 'dashboard'>('summary');
  const [selectedBulan, setSelectedBulan] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');



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

  const tabClass = (tab: 'summary' | 'full' | 'dashboard') =>
    `pro-btn flex items-center gap-2 !text-sm ${
      activeTab === tab
        ? 'pro-btn-primary'
        : 'pro-btn-ghost'
    }`;

  const getRowFormat = useCallback((row: EBISData, format: 'jaktim' | 'jaksel') => {
    const witelOld = row['WITEL_OLD'] || row['WITEL OLD'] || '';
    const sto = row['STO'] || '';
    const tgl = row['ORDER DATE'] || '';
    const segmen = witelOld;
    const paket = row['JENIS LAYANAN'] || '';
    const noOrder = row['ORDER'] || '';
    const inet = row['INTERNET'] || '';
    const namaSite = '';
    const alamat = row['ALAMAT'] || '';
    const status = row['STATUS RESUME'] || row['STATUS MESSAGE'] || row['STATUS'] || '';
    const update = row['LAST UPDATE STATUS'] || '';
    const detail = '';
    const short = '';

    if (format === 'jaktim') {
      return {
        'STO': sto,
        'TGL': tgl,
        'SEGMEN': segmen,
        'PAKET': paket,
        'NO ORDER': noOrder,
        'NO INTERNET / NO TELP': inet,
        'NAMA SITE': namaSite,
        'ALAMAT': alamat,
        'STATUS': status,
        'UPDATE': update,
        'DETAIL KETERANGAN': detail,
        'SHORT': short,
        'BULAN': selectedBulan,
      };
    } else {
      return {
        'STO': sto,
        'TANGGAL': tgl,
        'SEGMEN': segmen,
        'PAKET': paket,
        'NO ORDER': noOrder,
        'NAMA SITE': namaSite,
        'ALAMAT': alamat,
        'INET/TLP': inet,
        'STATUS': status,
        'UPDATE': update,
        'DETAIL KETERANGAN': detail,
        'UNIT': selectedUnit,
        'SHORT': short,
        'BULAN': selectedBulan,
      };
    }
  }, [selectedBulan, selectedUnit]);

  const jaktimHeaders = ['STO', 'TGL', 'SEGMEN', 'PAKET', 'NO ORDER', 'NO INTERNET / NO TELP', 'NAMA SITE', 'ALAMAT', 'STATUS', 'UPDATE', 'DETAIL KETERANGAN', 'SHORT', 'BULAN'];
  const jakselHeaders = ['STO', 'TANGGAL', 'SEGMEN', 'PAKET', 'NO ORDER', 'NAMA SITE', 'ALAMAT', 'INET/TLP', 'STATUS', 'UPDATE', 'DETAIL KETERANGAN', 'UNIT', 'SHORT', 'BULAN'];

  const jaktimData = filteredData.filter(row => {
    const w = (row['WITEL_OLD'] || row['WITEL OLD'] || '').toUpperCase();
    return w.includes('JAKTIM') || w.includes('JAKARTA TIMUR');
  });

  const jakselData = filteredData.filter(row => {
    const w = (row['WITEL_OLD'] || row['WITEL OLD'] || '').toUpperCase();
    return w.includes('JAKSEL') || w.includes('JAKARTA SELATAN');
  });

  const copyFormat = useCallback((format: 'jaktim' | 'jaksel') => {
    const isJaktim = format === 'jaktim';
    const hdrs = isJaktim ? jaktimHeaders : jakselHeaders;
    const targetData = isJaktim ? jaktimData : jakselData;

    if (targetData.length === 0) {
      onToast('❌ Tidak ada data untuk ' + format.toUpperCase());
      return;
    }

    const headerRow = hdrs.join('\t');
    const rows = targetData.map(row => {
      const formatted = getRowFormat(row, format);
      return hdrs.map(h => (formatted as any)[h] || '').join('\t');
    }).join('\n');
    const result = headerRow + '\n' + rows;
    navigator.clipboard.writeText(result).then(() => {
      onToast('✅ Data ' + format.toUpperCase() + ' berhasil disalin!');
    }).catch(() => {
      onToast('❌ Gagal menyalin data');
    });
  }, [jaktimData, jakselData, getRowFormat, onToast]);

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

        <button id="tab-dashboard" onClick={() => setActiveTab('dashboard')} className={tabClass('dashboard')}>
          <BarChart3 size={15} />
          Dashboard Import
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
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Menampilkan {filteredData.length} baris data asli.
            </p>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="pro-btn pro-btn-primary"
            >
              🚀 Import ke Dashboard
            </button>
          </div>

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

      {/* ── Dashboard Import Tab ── */}
      {activeTab === 'dashboard' && (
        <div>
          {/* Global Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 dark:bg-[#152336] rounded-xl border border-gray-100 dark:border-[#1e2d45]">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                Pilih BULAN (Global)
              </label>
              <select 
                value={selectedBulan} 
                onChange={e => setSelectedBulan(e.target.value)}
                className="pro-select w-full"
              >
                <option value="">— Kosongkan —</option>
                {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                Pilih UNIT (Khusus Jaksel)
              </label>
              <select 
                value={selectedUnit} 
                onChange={e => setSelectedUnit(e.target.value)}
                className="pro-select w-full"
              >
                <option value="">— Kosongkan —</option>
                <option value="REG">REG</option>
                <option value="NON REG">NON REG</option>
                <option value="FCC">FCC</option>
                <option value="BS (SALES)">BS (SALES)</option>
              </select>
            </div>
          </div>

          <div className="space-y-8">
            {/* JAKTIM SECTION */}
            <div className="border border-gray-100 dark:border-[#1e2d45] rounded-xl overflow-hidden bg-white dark:bg-[#111827]">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-[#1e2d45] bg-gray-50/50 dark:bg-[#152336]/50">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">Segmen JAKTIM</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{jaktimData.length} data ditemukan dari Witel JAKTIM</p>
                </div>
                <button 
                  onClick={() => copyFormat('jaktim')}
                  className="pro-btn pro-btn-primary !py-1.5 !px-3"
                  disabled={jaktimData.length === 0}
                >
                  <Copy size={14} /> Salin Data Jaktim
                </button>
              </div>
              <div className="pro-table-wrap !max-h-[300px]">
                <table className="pro-table">
                  <thead>
                    <tr>
                      <th className="w-8 text-center cursor-default">#</th>
                      {jaktimHeaders.map(h => <th key={h}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {jaktimData.length === 0 ? (
                      <tr><td colSpan={jaktimHeaders.length + 1} className="text-center py-6 text-gray-400 italic text-sm">Tidak ada data JAKTIM</td></tr>
                    ) : (
                      jaktimData.map((row, rowIdx) => {
                        const formatted = getRowFormat(row, 'jaktim');
                        return (
                          <tr key={rowIdx}>
                            <td className="text-center text-gray-400 text-xs">{rowIdx + 1}</td>
                            {jaktimHeaders.map(h => <td key={h}>{(formatted as any)[h]}</td>)}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* JAKSEL SECTION */}
            <div className="border border-gray-100 dark:border-[#1e2d45] rounded-xl overflow-hidden bg-white dark:bg-[#111827]">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-[#1e2d45] bg-gray-50/50 dark:bg-[#152336]/50">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">Segmen JAKSEL</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{jakselData.length} data ditemukan dari Witel JAKSEL</p>
                </div>
                <button 
                  onClick={() => copyFormat('jaksel')}
                  className="pro-btn pro-btn-primary !py-1.5 !px-3"
                  disabled={jakselData.length === 0}
                >
                  <Copy size={14} /> Salin Data Jaksel
                </button>
              </div>
              <div className="pro-table-wrap !max-h-[300px]">
                <table className="pro-table">
                  <thead>
                    <tr>
                      <th className="w-8 text-center cursor-default">#</th>
                      {jakselHeaders.map(h => <th key={h}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {jakselData.length === 0 ? (
                      <tr><td colSpan={jakselHeaders.length + 1} className="text-center py-6 text-gray-400 italic text-sm">Tidak ada data JAKSEL</td></tr>
                    ) : (
                      jakselData.map((row, rowIdx) => {
                        const formatted = getRowFormat(row, 'jaksel');
                        return (
                          <tr key={rowIdx}>
                            <td className="text-center text-gray-400 text-xs">{rowIdx + 1}</td>
                            {jakselHeaders.map(h => <td key={h}>{(formatted as any)[h]}</td>)}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
