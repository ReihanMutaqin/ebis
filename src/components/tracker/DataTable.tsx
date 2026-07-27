import { useState, useMemo, useRef, useEffect } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { hideTaskToAnomaly } from "../../lib/db";
import type { TaskData } from "../../lib/db";
import { Filter, X, Download, Search, Trash2, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";

interface DataTableProps {
  data: TaskData[];
}

type ColumnKey = 'witel' | 'sto' | 'orderDate' | 'unit' | 'paket' | 'order' | 'woId' | 'nik' | 'technicianName' | 'internet' | 'customerName' | 'address' | 'trackerStatus' | 'statusMessage';

const COLUMNS: { key: ColumnKey, label: string }[] = [
  { key: 'witel', label: 'WITEL' },
  { key: 'sto', label: 'STO' },
  { key: 'orderDate', label: 'LAST UPDATE STATUS' },
  { key: 'unit', label: 'UNIT' },
  { key: 'paket', label: 'PAKET' },
  { key: 'order', label: 'NO ORDER' },
  { key: 'woId', label: 'WO ID' },
  { key: 'nik', label: 'NIK TEKNISI' },
  { key: 'technicianName', label: 'NAMA TEKNISI' },
  { key: 'internet', label: 'NO INTERNET / TELP' },
  { key: 'customerName', label: 'NAMA PELANGGAN' },
  { key: 'address', label: 'ALAMAT' },
  { key: 'trackerStatus', label: 'STATUS' },
  { key: 'statusMessage', label: 'STATUS MESSAGE' },
];

const getFilterValue = (key: ColumnKey, rawVal: string) => {
  if (!rawVal) return '';
  const val = String(rawVal);
  if (key === 'orderDate') {
    return val.split(' ')[0];
  }
  if (key === 'statusMessage') {
    // Aggressive truncation: split by common delimiters to get the core message
    let clean = val.split(',')[0].split('.')[0].split('-')[0].trim();
    if (clean.length > 25) {
      clean = clean.substring(0, 25).trim() + '...';
    }
    return clean;
  }
  return val;
};

export function DataTable({ data }: DataTableProps) {
  const [filters, setFilters] = useState<Record<ColumnKey, Set<string>>>({} as Record<ColumnKey, Set<string>>);
  const [openFilter, setOpenFilter] = useState<ColumnKey | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRow, setSelectedRow] = useState<TaskData | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const [exportStatus, setExportStatus] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchStatus, setBatchStatus] = useState<"confirm" | "loading" | "success" | "error">("confirm");

  // Memoize unique filter values per column for maximum speed
  const uniqueValuesByColumn = useMemo(() => {
    const result: Record<ColumnKey, string[]> = {} as any;
    COLUMNS.forEach(col => {
      const set = new Set<string>();
      data.forEach(d => {
        set.add(getFilterValue(col.key, String(d[col.key] || '')));
      });
      result[col.key] = Array.from(set).sort();
    });
    return result;
  }, [data]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setOpenFilter(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = async () => {
    let toExport = data;
    
    // First apply search
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      toExport = toExport.filter(row => {
        return COLUMNS.some(col => {
          const val = String(row[col.key] || '').toLowerCase();
          return val.includes(lowerSearch);
        });
      });
    }

    // Then, apply current table filters so it respects WITEL, Date, etc. if selected
    toExport = toExport.filter(row => {
      for (const key of Object.keys(filters) as ColumnKey[]) {
        const activeFilters = filters[key];
        if (activeFilters && activeFilters.size > 0) {
          const val = getFilterValue(key, String(row[key] || ''));
          if (!activeFilters.has(val)) {
            return false;
          }
        }
      }
      return true;
    });

    // Then apply the specific export status dropdown filter
    if (exportStatus !== "ALL") {
      toExport = toExport.filter(d => d.trackerStatus === exportStatus);
    }
    
    if (toExport.length === 0) {
      alert("Tidak ada data untuk diexport!");
      return;
    }

    const exportCols = [...COLUMNS, { key: 'notes', label: 'CATATAN TEKNISI' }, { key: 'technicianName', label: 'NAMA TEKNISI' }];
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data EBIS');

    // Add Header Row
    const headerRow = worksheet.addRow(exportCols.map(c => c.label));
    
    // Style the header row
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E40AF' } // Tailwind blue-800
      };
      cell.font = {
        color: { argb: 'FFFFFFFF' },
        bold: true
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add Data Rows
    const statusColIndex = exportCols.findIndex(c => c.key === 'trackerStatus') + 1;

    toExport.forEach(row => {
      const rowData = exportCols.map(col => {
        let val = String((row as any)[col.key] || '');
        if (col.key === 'orderDate') {
          val = val.split(' ')[0];
        }
        return val;
      });
      
      const dataRow = worksheet.addRow(rowData);
      dataRow.eachCell((cell, colNumber) => {
         cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
         };
         cell.alignment = { vertical: 'middle', wrapText: true };
         
         // Apply color to Status column
         if (colNumber === statusColIndex) {
           const statusText = String(cell.value).toUpperCase();
           let bgColor = '';
           if (statusText === 'COMPLETED') bgColor = 'FF10B981'; // Green
           else if (statusText === 'ON PROGRESS') bgColor = 'FF3B82F6'; // Blue
           else if (statusText === 'KENDALA') bgColor = 'FFF59E0B'; // Amber
           else if (statusText === 'CANCEL') bgColor = 'FFEF4444'; // Red
           else if (statusText === 'PENDING') bgColor = 'FF94A3B8'; // Slate
           
           if (bgColor) {
             cell.fill = {
               type: 'pattern',
               pattern: 'solid',
               fgColor: { argb: bgColor }
             };
             cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
           } else {
             cell.font = { bold: true };
           }
         }
      });
    });

    // Adjust column widths
    worksheet.columns.forEach(column => {
      column.width = 28;
    });

    // Download the file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `export_${exportStatus === 'ALL' ? 'semua' : exportStatus}_${new Date().getTime()}.xlsx`);
  };

  const handleBatchAnomaly = async () => {
    setBatchStatus("loading");
    try {
      const promises = Array.from(selectedRows).map(id => hideTaskToAnomaly(id));
      await Promise.all(promises);
      setBatchStatus("success");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e) {
      console.error(e);
      setBatchStatus("error");
    }
  };

  const filteredData = useMemo(() => {
    let result = data;
    
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(row => {
        return COLUMNS.some(col => {
          const val = String(row[col.key] || '').toLowerCase();
          return val.includes(lowerSearch);
        });
      });
    }

    result = result.filter(row => {
      for (const key of Object.keys(filters) as ColumnKey[]) {
        const activeFilters = filters[key];
        if (activeFilters && activeFilters.size > 0) {
          const val = getFilterValue(key, String(row[key] || ''));
          if (!activeFilters.has(val)) {
            return false;
          }
        }
      }
      return true;
    });

    return result;
  }, [data, filters, searchTerm]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const toggleFilter = (col: ColumnKey, val: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (!newFilters[col]) newFilters[col] = new Set();
      
      const newSet = new Set(newFilters[col]);
      if (newSet.has(val)) {
        newSet.delete(val);
      } else {
        newSet.add(val);
      }
      newFilters[col] = newSet;
      return newFilters;
    });
  };

  const clearFilter = (col: ColumnKey) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      newFilters[col] = new Set();
      return newFilters;
    });
  };

  const selectAll = (col: ColumnKey, uniqueVals: string[]) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      newFilters[col] = new Set(uniqueVals);
      return newFilters;
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col mt-6 transition-all duration-300">
      <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 dark:bg-slate-900/50/80 gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Full Detail Order</h2>
          <div className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Menampilkan {filteredData.length} dari {data.length} data
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {selectedRows.size > 0 && (
            <button 
              onClick={() => {
                setBatchStatus("confirm");
                setShowBatchModal(true);
              }}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              Batch Anomali ({selectedRows.size})
            </button>
          )}
          <div className="relative flex-1 sm:flex-none">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </div>
            <input 
              type="text" 
              placeholder="Cari data..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 w-full outline-none transition-all shadow-sm"
            />
          </div>
          <select
            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none font-semibold shadow-sm"
            value={exportStatus}
            onChange={(e) => setExportStatus(e.target.value)}
          >
            <option value="ALL">Semua Status</option>
            <option value="Completed">Completed</option>
            <option value="Kendala">Kendala</option>
            <option value="On Progress">On Progress</option>
            <option value="Pending">Pending</option>
            <option value="Cancel">Cancel</option>
          </select>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto max-h-[600px] min-h-[400px] relative rounded-b-2xl">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 uppercase sticky top-0 z-20 shadow-sm ring-1 ring-slate-200">
            <tr>
              <th className="px-4 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700/95 sticky left-0 z-30">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  checked={paginatedData.length > 0 && paginatedData.every(row => selectedRows.has(row.id))}
                  onChange={(e) => {
                    const newSet = new Set(selectedRows);
                    if (e.target.checked) {
                      paginatedData.forEach(row => newSet.add(row.id));
                    } else {
                      paginatedData.forEach(row => newSet.delete(row.id));
                    }
                    setSelectedRows(newSet);
                  }}
                />
              </th>
              {COLUMNS.map(col => {
                const uniqueVals = uniqueValuesByColumn[col.key] || [];
                const isActive = filters[col.key] && filters[col.key].size > 0;
                const isOpen = openFilter === col.key;
                
                return (
                  <th key={col.key} className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 font-extrabold whitespace-nowrap bg-slate-100 dark:bg-slate-700/95 relative">
                    <div 
                      className="flex items-center justify-between gap-3 cursor-pointer hover:text-blue-600 select-none group transition-colors duration-200"
                      onClick={() => setOpenFilter(isOpen ? null : col.key)}
                    >
                      {col.label}
                      <Filter className={`w-4 h-4 transition-transform ${isOpen ? 'text-blue-500 rotate-180' : isActive ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500 group-hover:text-blue-400'}`} />
                    </div>
                    
                    {isOpen && (
                      <div ref={filterRef} className="absolute top-full mt-2 left-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl w-64 z-50 normal-case font-normal text-slate-700 dark:text-slate-300 ring-1 ring-black/5">
                        <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                          <label className="flex items-center gap-2 p-1 hover:bg-slate-50 dark:bg-slate-900/50 rounded cursor-pointer border-b border-slate-100 dark:border-slate-700 mb-1 pb-2">
                            <input 
                              type="checkbox" 
                              className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                              checked={(filters[col.key]?.size || 0) === uniqueVals.length && uniqueVals.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) selectAll(col.key, uniqueVals);
                                else clearFilter(col.key);
                              }}
                            />
                            <span className="text-xs font-semibold">(Pilih Semua)</span>
                          </label>
                          {uniqueVals.map(val => {
                            const checked = filters[col.key]?.has(val);
                            const displayVal = val;
                            return (
                              <label key={val} className="flex items-center gap-2 p-1 hover:bg-slate-50 dark:bg-slate-900/50 rounded cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                                  checked={checked || false}
                                  onChange={() => toggleFilter(col.key, val)}
                                />
                                <span className="text-xs truncate" title={displayVal}>{displayVal || '(Kosong)'}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-800">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, i) => {
                const isSelected = selectedRows.has(row.id);
                return (
                  <tr 
                    key={row.id || i} 
                    className={`hover:bg-blue-50/60 transition-colors duration-150 cursor-pointer group ${isSelected ? 'bg-blue-50/80' : ''}`}
                    onClick={() => setSelectedRow(row)}
                  >
                    <td className="px-4 py-3 border-slate-100 dark:border-slate-700 sticky left-0 z-10 bg-inherit" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          const newSet = new Set(selectedRows);
                          if (e.target.checked) {
                            newSet.add(row.id);
                          } else {
                            newSet.delete(row.id);
                          }
                          setSelectedRows(newSet);
                        }}
                      />
                    </td>
                    {COLUMNS.map(col => {
                      let displayVal = String(row[col.key] || '');
                      if (col.key === 'orderDate') {
                        displayVal = displayVal.split(' ')[0]; // Only show YYYY-MM-DD, hide time
                      } else {
                        displayVal = getFilterValue(col.key, displayVal);
                      }
                      return (
                        <td key={col.key} className="px-5 py-3.5 text-slate-700 dark:text-slate-300 font-medium truncate max-w-[220px] group-hover:text-slate-900 dark:text-white" title={String(row[col.key] || '')}>
                          {displayVal || '-'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-5 py-12 text-center">
                  <div className="text-slate-400 dark:text-slate-500 font-medium text-lg">Tidak ada data yang sesuai filter.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-600 dark:text-slate-300 gap-3">
          <div>
            Menampilkan halaman {currentPage} dari {totalPages} ({filteredData.length} total data)
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Sebelumnya
            </button>
            <span className="px-2 font-bold text-slate-800 dark:text-slate-100">{currentPage} / {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Berikutnya
            </button>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="ml-2 border border-slate-300 dark:border-slate-600 rounded-lg p-1.5 bg-white dark:bg-slate-800 outline-none font-semibold text-slate-700 dark:text-slate-300 shadow-sm"
            >
              <option value={25}>25 / hal</option>
              <option value={50}>50 / hal</option>
              <option value={100}>100 / hal</option>
            </select>
          </div>
        </div>
      )}

      {selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Detail Order: {selectedRow.order}</h2>
              <div className="flex gap-2">
                <button 
                  onClick={async () => {
                    if (window.confirm(`Yakin ingin menyembunyikan Order ${selectedRow.order}? Order akan dipindahkan ke database anomali.`)) {
                      try {
                        await hideTaskToAnomaly(selectedRow.id);
                        alert('Order berhasil disembunyikan dan dipindah ke anomali!');
                        window.location.reload();
                      } catch (e) {
                        console.error(e);
                        alert('Gagal menyembunyikan order.');
                      }
                    }
                  }}
                  className="p-2 bg-white dark:bg-slate-800 hover:bg-red-500 hover:text-white text-slate-400 dark:text-slate-500 rounded-full transition-colors shadow-sm ring-1 ring-slate-200 hover:ring-red-500"
                  title="Sembunyikan Order (Anomali)"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setSelectedRow(null)}
                  className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-500 hover:text-white text-slate-400 dark:text-slate-500 rounded-full transition-colors shadow-sm ring-1 ring-slate-200 hover:ring-slate-500"
                  title="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50/30">
              {COLUMNS.map(col => {
                let val = String(selectedRow[col.key] || '');
                if (col.key === 'orderDate') {
                  val = val.split(' ')[0];
                }
                return (
                  <div key={col.key} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{col.label}</span>
                    <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100 break-words">
                      {val || '-'}
                    </span>
                  </div>
                );
              })}
              
              <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 shadow-sm md:col-span-2">
                <span className="block text-[11px] font-bold text-red-500 uppercase tracking-wider mb-1">CATATAN TEKNISI</span>
                <span className="block text-sm font-semibold text-red-900 break-words">
                  {selectedRow.notes || 'Tidak ada catatan.'}
                </span>
              </div>
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 shadow-sm md:col-span-2">
                <span className="block text-[11px] font-bold text-blue-500 uppercase tracking-wider mb-1">NAMA TEKNISI</span>
                <span className="block text-sm font-semibold text-blue-900 break-words">
                  {selectedRow.technicianName || 'Belum diambil.'}
                </span>
              </div>
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 shadow-sm md:col-span-2">
                <span className="block text-[11px] font-bold text-indigo-500 uppercase tracking-wider mb-1">DI UPDATE OLEH / TELEGRAM</span>
                <span className="block text-sm font-semibold text-indigo-900 break-words">
                  {selectedRow.telegramHandle || selectedRow.updatedBy || '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Batch Anomaly Custom Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-4">
              
              <div className="flex justify-center">
                {batchStatus === "confirm" && (
                  <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-2">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                )}
                {batchStatus === "loading" && (
                  <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-2">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                )}
                {batchStatus === "success" && (
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-2 animate-in zoom-in">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                )}
                {batchStatus === "error" && (
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2">
                    <X className="w-8 h-8" />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {batchStatus === "confirm" && "Pindah ke Anomali?"}
                  {batchStatus === "loading" && "Memproses..."}
                  {batchStatus === "success" && "Berhasil!"}
                  {batchStatus === "error" && "Gagal Memproses"}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  {batchStatus === "confirm" && `Anda akan memindahkan ${selectedRows.size} order yang dipilih ke database Anomali. Order ini akan disembunyikan dari tabel utama.`}
                  {batchStatus === "loading" && "Sedang memindahkan data ke database anomali, mohon tunggu sebentar."}
                  {batchStatus === "success" && "Semua order yang dipilih telah berhasil dipindahkan. Memuat ulang halaman..."}
                  {batchStatus === "error" && "Terjadi kesalahan saat memindahkan order. Silakan coba lagi."}
                </p>
              </div>

              {batchStatus === "confirm" && (
                <div className="flex justify-center gap-3 pt-4">
                  <button
                    onClick={() => setShowBatchModal(false)}
                    className="px-4 py-2 rounded-lg font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-700 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleBatchAnomaly}
                    className="px-4 py-2 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-500/30 transition-colors"
                  >
                    Ya, Pindahkan
                  </button>
                </div>
              )}
              {batchStatus === "error" && (
                <div className="flex justify-center gap-3 pt-4">
                  <button
                    onClick={() => setShowBatchModal(false)}
                    className="px-4 py-2 rounded-lg font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:bg-slate-700 transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
