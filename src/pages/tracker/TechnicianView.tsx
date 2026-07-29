import { useState, useEffect } from "react";
import { getTasksByWitel, updateTaskStatus } from "../../lib/db";
import type { TaskData } from "../../lib/db";
import { MapPin, User, CheckCircle, AlertTriangle, Loader2, Search } from "lucide-react";

const formatMonth = (yyyyMm: string) => {
  const [year, month] = yyyyMm.split('-');
  if (!year || !month) return yyyyMm;
  const mNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const mIdx = parseInt(month, 10) - 1;
  return mIdx >= 0 && mIdx < 12 ? `${mNames[mIdx]} ${year}` : yyyyMm;
};

export default function TechnicianView() {
  const [witels, setWitels] = useState<string[]>([]);
  const [selectedWitel, setSelectedWitel] = useState<string>("ALL");
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [selectedStatusResume, setSelectedStatusResume] = useState<string>("");
  const [selectedSto, setSelectedSto] = useState<string>("");
  const [selectedTrackerStatus, setSelectedTrackerStatus] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  const [confirmData, setConfirmData] = useState<any>(null);

  useEffect(() => {
    async function loadWitels() {
      // Hardcode to only show JAKSEL, JAKTIM, JAKPUS
      setWitels(["JAKSEL", "JAKTIM", "JAKPUS"]);
      setLoading(false);
    }
    loadWitels();
  }, []);

  useEffect(() => {
    if (!selectedWitel) return;
    loadTasks();
  }, [selectedWitel]);

  async function loadTasks() {
    setLoading(true);
    try {
      const data = await getTasksByWitel(selectedWitel);
      setTasks(data || []);
    } catch (e) {
      console.error("Failed to load tasks in TechnicianView:", e);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTask) return;

    const formData = new FormData(e.currentTarget);
    let handle = (formData.get("telegramHandle") as string || "").trim();
    if (handle && !handle.startsWith('@') && !handle.startsWith('-')) {
      handle = `@${handle}`;
    }

    const updates = {
      technicianName: formData.get("technicianName") as string,
      telegramHandle: handle,
      updatedBy: handle || (selectedTask.updatedBy || ''),
      woId: (formData.get("woId") as string || '').trim(),
      nik: (formData.get("nik") as string || '').trim(),
      trackerStatus: formData.get("trackerStatus") as any,
      notes: formData.get("notes") as string,
    };

    setConfirmData(updates);
  };

  const confirmUpdate = async () => {
    if (!selectedTask || !confirmData) return;
    setLoading(true);
    await updateTaskStatus(selectedTask.id, confirmData);
    await loadTasks();
    setSelectedTask(null);
    setConfirmData(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'On Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Kendala': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Cancel': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700';
    }
  };

  const uniqueStatusResumes = Array.from(new Set(tasks.map(t => t.statusResume))).filter(Boolean).sort();
  const uniqueStos = Array.from(new Set(tasks.map(t => t.sto))).filter(Boolean).sort();
  const uniqueDates = Array.from(new Set(tasks.map(t => {
    const parts = (t.orderDate || '').split(' ')[0].split('-');
    if (parts.length >= 2) return `${parts[0]}-${parts[1]}`;
    return '';
  }))).filter(Boolean).sort().reverse();
  
  let filteredTasks = tasks;
  if (selectedStatusResume) {
    filteredTasks = filteredTasks.filter(t => t.statusResume === selectedStatusResume);
  }
  if (selectedSto) {
    filteredTasks = filteredTasks.filter(t => t.sto === selectedSto);
  }
  if (selectedTrackerStatus) {
    filteredTasks = filteredTasks.filter(t => t.trackerStatus === selectedTrackerStatus);
  }
  if (selectedDate) {
    filteredTasks = filteredTasks.filter(t => {
      const parts = (t.orderDate || '').split(' ')[0].split('-');
      const m = parts.length >= 2 ? `${parts[0]}-${parts[1]}` : '';
      return m === selectedDate;
    });
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredTasks = filteredTasks.filter(t => 
      String(t.order || '').toLowerCase().includes(q) ||
      String(t.customerName || '').toLowerCase().includes(q) ||
      String(t.address || '').toLowerCase().includes(q) ||
      String(t.woId || '').toLowerCase().includes(q) ||
      String(t.nik || '').toLowerCase().includes(q)
    );
  }

  const tasksForCounts = tasks.filter(t => {
    if (selectedStatusResume && t.statusResume !== selectedStatusResume) return false;
    if (selectedSto && t.sto !== selectedSto) return false;
    if (selectedDate) {
      const parts = (t.orderDate || '').split(' ')[0].split('-');
      const m = parts.length >= 2 ? `${parts[0]}-${parts[1]}` : '';
      if (m !== selectedDate) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = String(t.order || '').toLowerCase().includes(q) ||
                    String(t.customerName || '').toLowerCase().includes(q) ||
                    String(t.address || '').toLowerCase().includes(q) ||
                    String(t.woId || '').toLowerCase().includes(q) ||
                    String(t.nik || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const statusCounts = {
    'Pending': 0, 'On Progress': 0, 'Completed': 0, 'Kendala': 0, 'Cancel': 0
  };
  tasksForCounts.forEach(t => {
    if (statusCounts[t.trackerStatus] !== undefined) {
      statusCounts[t.trackerStatus as keyof typeof statusCounts]++;
    }
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[calc(100vh-8rem)]">
      {/* Sidebar: Witel Selector & Task List */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Pilih WITEL Area Anda</label>
          <select 
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={selectedWitel}
            onChange={(e) => setSelectedWitel(e.target.value)}
          >
            <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">Semua WITEL (ALL)</option>
            {witels.map(w => (
              <option key={w} value={w} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">{w}</option>
            ))}
          </select>

          {tasks.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Filter Bulan</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                >
                  <option value="" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">Semua Bulan</option>
                  {uniqueDates.map(d => (
                    <option key={d} value={d} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">{formatMonth(d)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Filter STO</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs"
                  value={selectedSto}
                  onChange={(e) => setSelectedSto(e.target.value)}
                >
                  <option value="" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">Semua STO</option>
                  {uniqueStos.map(s => (
                    <option key={s} value={s} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">{s}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Filter Status EBIS</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs"
                  value={selectedStatusResume}
                  onChange={(e) => setSelectedStatusResume(e.target.value)}
                >
                  <option value="" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">Semua Status</option>
                  {uniqueStatusResumes.map(s => (
                    <option key={s} value={s} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">{s}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {tasks.length > 0 && (
            <div className="mt-3 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Cari order, nama pelanggan, alamat, WO, NIK..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        {selectedWitel && tasks.length > 0 && (
          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex gap-2 overflow-x-auto scrollbar-hide shrink-0 sticky top-16 z-30">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div 
                key={status} 
                onClick={() => setSelectedTrackerStatus(selectedTrackerStatus === status ? "" : status)}
                className={`cursor-pointer flex-shrink-0 px-3 py-1.5 rounded-lg border text-xs font-bold flex flex-col items-center min-w-[70px] transition-all 
                  ${getStatusColor(status)} 
                  ${selectedTrackerStatus === status ? 'ring-2 ring-blue-500 shadow-md scale-105' : 'opacity-70 hover:opacity-100'}
                `}
              >
                <span className="text-lg">{count}</span>
                <span className="opacity-80 text-[10px] uppercase tracking-wider">{status}</span>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 flex-1 lg:overflow-y-auto overflow-y-auto max-h-[50vh] lg:max-h-none rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-2 space-y-2">
          {loading && !selectedWitel && (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400 dark:text-slate-500" /></div>
          )}
          {!selectedWitel && !loading && (
            <div className="text-center p-8 text-slate-500 dark:text-slate-400">Pilih WITEL untuk melihat daftar order.</div>
          )}
          {selectedWitel && tasks.length === 0 && !loading && (
            <div className="text-center p-8 text-slate-500 dark:text-slate-400">Tidak ada tugas di Witel {selectedWitel}.</div>
          )}

          {filteredTasks.map(task => (
            <div 
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className={`p-4 rounded-lg cursor-pointer border transition-all ${selectedTask?.id === task.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-sm' : 'border-slate-100 dark:border-slate-700 hover:border-blue-300 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-slate-800 dark:text-slate-100">{task.order}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border ${getStatusColor(task.trackerStatus)} font-medium`}>
                  {task.trackerStatus}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{task.customerName}</p>
              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-2 gap-1 truncate">
                <MapPin className="w-3 h-3" /> {task.address}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content: Task Details & Update Form */}
      <div className="w-full lg:w-2/3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col min-h-[50vh]">
        {selectedTask ? (
          <>
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedTask.order}</h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">{selectedTask.customerName}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getStatusColor(selectedTask.trackerStatus)}`}>
                  {selectedTask.trackerStatus}
                </span>
              </div>
            </div>
            
            <div className="p-4 lg:p-6 flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-3">Informasi Pelanggan</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                      <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{selectedTask.address}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                      <p className="text-slate-700 dark:text-slate-300 text-sm">{selectedTask.serviceType || 'Tidak diketahui'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-3">Sistem Utama (EBIS)</h3>
                  <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg text-sm text-slate-700 dark:text-slate-300 space-y-2">
                    <div className="flex justify-between border-b pb-1 border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400">WO ID:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{selectedTask.woId || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1 border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400">NIK Teknisi:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{selectedTask.nik || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1 border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400">Internet:</span>
                      <span className="font-semibold">{selectedTask.internet || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1 border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400">STO:</span>
                      <span className="font-semibold">{selectedTask.sto || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1 border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400">Tgl Order:</span>
                      <span className="font-semibold">{(selectedTask.orderDate || '').split(' ')[0] || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1 border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400">Di Update Oleh / Telegram:</span>
                      <span className="font-semibold text-blue-600">{selectedTask.telegramHandle || selectedTask.updatedBy || '-'}</span>
                    </div>
                    <div className="pt-1">
                      <span className="text-slate-500 dark:text-slate-400 block mb-1">Status Resume:</span>
                      <span className="font-mono bg-white dark:bg-slate-800 px-2 py-1 rounded block">{selectedTask.statusResume || '-'}</span>
                    </div>
                    <div className="pt-1">
                      <span className="text-slate-500 dark:text-slate-400 block mb-1">Status Message:</span>
                      <span className="font-mono text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded block">{selectedTask.statusMessage || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                {selectedTask.trackerStatus === 'Kendala' && selectedTask.notes && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                    <div>
                      <h4 className="font-bold text-sm">Kendala Dilaporkan</h4>
                      <p className="text-sm mt-1">{selectedTask.notes}</p>
                    </div>
                  </div>
                )}
                
                <h3 className="text-sm font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-4">Update Pekerjaan</h3>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Teknisi</label>
                    <input 
                      name="technicianName"
                      defaultValue={selectedTask.technicianName}
                      required
                      className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Masukkan nama Anda"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username / @ Telegram Teknisi</label>
                    <input 
                      name="telegramHandle"
                      defaultValue={selectedTask.telegramHandle || selectedTask.updatedBy || ''}
                      className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Contoh: @UsernameTelegram"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">WO ID</label>
                      <input 
                        name="woId"
                        defaultValue={selectedTask.woId || ''}
                        className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                        placeholder="WO123456"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">NIK Teknisi</label>
                      <input 
                        name="nik"
                        defaultValue={selectedTask.nik || ''}
                        className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                        placeholder="12345678"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status Lapangan</label>
                    <select 
                      name="trackerStatus"
                      defaultValue={selectedTask.trackerStatus}
                      className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                    >
                      <option value="Pending">Pending</option>
                      <option value="On Progress">On Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Kendala">Kendala</option>
                      <option value="Cancel">Cancel</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Catatan Tambahan</label>
                    <textarea 
                      name="notes"
                      defaultValue={selectedTask.notes}
                      rows={4}
                      className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none text-sm"
                      placeholder="Contoh: Kabel putus di tiang utama, butuh tim splicing..."
                    ></textarea>
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors flex justify-center"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Update"}
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center">
            <CheckCircle className="w-16 h-16 mb-4 text-slate-200" />
            <p className="text-xl font-medium text-slate-600 dark:text-slate-300">Pilih tugas di menu samping</p>
            <p className="text-sm mt-2">Anda dapat melihat detail pelanggan dan mengupdate status pengerjaan.</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4 mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-center text-slate-800 dark:text-slate-100 mb-2">Konfirmasi Update</h3>
              <p className="text-slate-600 dark:text-slate-300 text-center text-sm mb-6">Apakah data update yang Anda masukkan sudah benar?</p>
              
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700 mb-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Nama Teknisi:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{confirmData.technicianName}</span>
                </div>
                {confirmData.telegramHandle && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Telegram:</span>
                    <span className="font-semibold text-blue-600">{confirmData.telegramHandle}</span>
                  </div>
                )}
                {confirmData.woId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">WO ID:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{confirmData.woId}</span>
                  </div>
                )}
                {confirmData.nik && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">NIK Teknisi:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{confirmData.nik}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Status Baru:</span>
                  <span className={`font-bold ${getStatusColor(confirmData.trackerStatus).split(' ')[1]}`}>{confirmData.trackerStatus}</span>
                </div>
                {confirmData.notes && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Catatan:</span>
                    <span className="font-semibold text-right max-w-[150px] truncate">{confirmData.notes}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmData(null)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmUpdate}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Konfirmasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
