import { db } from "./firebase";
import { collection, getDocs, updateDoc, doc, query, where, writeBatch } from "firebase/firestore";
import localforage from "localforage";

export interface TaskData {
  id: string; // The ORDER number will be the ID
  witel: string;
  order: string;
  woId?: string;
  nik?: string;
  statusResume: string;
  customerName: string;
  address: string;
  serviceType: string;
  unit?: string;
  paket?: string;
  technicianName: string;
  telegramHandle?: string;
  updatedBy?: string;
  trackerStatus: 'Pending' | 'On Progress' | 'Completed' | 'Kendala' | 'Cancel';
  notes: string;
  internet: string;
  statusMessage: string;
  sto: string;
  orderDate: string;
  updatedAt: string;
}

const COLLECTION_NAME = "ebis_tasks";

function isLocalMode() {
  return !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === "dummy-api-key";
}

export async function importDataToFirestore(dataList: any[]): Promise<{ added: number, duplicates: number }> {
  let added = 0;
  let duplicates = 0;

  if (isLocalMode()) {
    console.log("Running in Local Storage Mode");
    const existing = await localforage.getItem<Record<string, TaskData>>(COLLECTION_NAME) || {};
    dataList.forEach(item => {
      const orderId = String(item['ORDER'] || `UNKNOWN-${Math.random()}`);
      const newStatusMessage = item['STATUS MESSAGE'] || '';
      const isCompleted = newStatusMessage.toLowerCase().includes('completed') || 
                          (item['STATUS RESUME'] || '').toLowerCase().includes('completed');
      
      if (!existing[orderId]) {
        existing[orderId] = {
          id: orderId,
          witel: item['WITEL_OLD'] || 'UNKNOWN',
          order: orderId,
          woId: item['WO ID'] || item['WO'] || '',
          nik: item['NIK'] || item['NIK TEKNISI'] || '',
          statusResume: item['STATUS RESUME'] || '',
          customerName: item['NAMA CUST'] || '',
          address: item['ALAMAT'] || '',
          serviceType: item['JENIS LAYANAN'] || '',
          unit: item['UNIT'] || '',
          paket: item['JENIS LAYANAN'] || '',
          technicianName: isCompleted ? 'SISTEM' : '',
          trackerStatus: isCompleted ? 'Completed' : 'Pending',
          notes: '',
          internet: item['INTERNET'] || '',
          statusMessage: newStatusMessage,
          sto: item['STO'] || '',
          orderDate: item['LAST UPDATE STATUS'] || item['ORDER DATE'] || item['TGL ORDER'] || '',
          updatedAt: new Date().toISOString()
        };
        added++;
      } else {
        const old = existing[orderId];
        const needsAutoComplete = isCompleted && old.trackerStatus !== 'Completed';
        if (old.statusMessage !== newStatusMessage || needsAutoComplete) {
          existing[orderId] = {
            ...old,
            witel: item['WITEL_OLD'] || old.witel,
            statusResume: item['STATUS RESUME'] || old.statusResume,
            customerName: item['NAMA CUST'] || old.customerName,
            address: item['ALAMAT'] || old.address,
            serviceType: item['JENIS LAYANAN'] || old.serviceType,
            unit: item['UNIT'] || old.unit || '',
            paket: item['JENIS LAYANAN'] || old.paket || '',
            internet: item['INTERNET'] || old.internet,
            statusMessage: newStatusMessage,
            sto: item['STO'] || old.sto,
            orderDate: item['LAST UPDATE STATUS'] || item['ORDER DATE'] || item['TGL ORDER'] || old.orderDate,
            updatedAt: new Date().toISOString(),
            ...(isCompleted ? { trackerStatus: 'Completed', technicianName: 'SISTEM' } : {})
          };
          duplicates++;
        }
      }
    });
    await localforage.setItem(COLLECTION_NAME, existing);
    return { added, duplicates };
  }
  
  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  const existingDocs = new Map<string, TaskData>();
  querySnapshot.forEach(d => existingDocs.set(d.id, d.data() as TaskData));

  const batch = writeBatch(db);
  let batchCount = 0;
  
  dataList.forEach(item => {
    const orderId = String(item['ORDER'] || `UNKNOWN-${Math.random()}`);
    const newStatusMessage = item['STATUS MESSAGE'] || '';
    const isCompleted = newStatusMessage.toLowerCase().includes('completed') || 
                        (item['STATUS RESUME'] || '').toLowerCase().includes('completed');

    if (existingDocs.has(orderId)) {
      const old = existingDocs.get(orderId)!;
      const needsAutoComplete = isCompleted && old.trackerStatus !== 'Completed';
      
      if (old.statusMessage !== newStatusMessage || needsAutoComplete) {
        duplicates++;
        const docRef = doc(db, COLLECTION_NAME, orderId);
        
        const updateData: any = {
          witel: item['WITEL_OLD'] || old.witel || 'UNKNOWN',
          statusResume: item['STATUS RESUME'] || old.statusResume || '',
          customerName: item['NAMA CUST'] || old.customerName || '',
          address: item['ALAMAT'] || old.address || '',
          serviceType: item['JENIS LAYANAN'] || old.serviceType || '',
          unit: item['UNIT'] || old.unit || '',
          paket: item['JENIS LAYANAN'] || old.paket || '',
          internet: item['INTERNET'] || old.internet || '',
          statusMessage: newStatusMessage,
          sto: item['STO'] || old.sto || '',
          orderDate: item['LAST UPDATE STATUS'] || item['ORDER DATE'] || item['TGL ORDER'] || old.orderDate || '',
          updatedAt: new Date().toISOString()
        };

        if (isCompleted) {
          updateData.trackerStatus = 'Completed';
          updateData.technicianName = 'SISTEM';
        }

        batch.set(docRef, updateData, { merge: true });
        batchCount++;
      }
    } else {
      added++;
      existingDocs.set(orderId, {} as TaskData); // avoid counting duplicates within same json
      
      const docRef = doc(db, COLLECTION_NAME, orderId);
      const task: TaskData = {
        id: orderId,
        witel: item['WITEL_OLD'] || 'UNKNOWN',
        order: orderId,
        woId: item['WO ID'] || item['WO'] || '',
        nik: item['NIK'] || item['NIK TEKNISI'] || '',
        statusResume: item['STATUS RESUME'] || '',
        customerName: item['NAMA CUST'] || '',
        address: item['ALAMAT'] || '',
        serviceType: item['JENIS LAYANAN'] || '',
        unit: item['UNIT'] || '',
        paket: item['JENIS LAYANAN'] || '',
        technicianName: isCompleted ? 'SISTEM' : '', 
        trackerStatus: isCompleted ? 'Completed' : 'Pending',
        notes: '',
        internet: item['INTERNET'] || '',
        statusMessage: newStatusMessage,
        sto: item['STO'] || '',
        orderDate: item['LAST UPDATE STATUS'] || item['ORDER DATE'] || item['TGL ORDER'] || '',
        updatedAt: new Date().toISOString()
      };
      
      batch.set(docRef, task);
      batchCount++;
    }
  });

  if (batchCount > 0) {
    await batch.commit();
  }
  
  return { added, duplicates };
}

export async function getTasksByWitel(witel: string): Promise<TaskData[]> {
  if (isLocalMode()) {
    const all = await localforage.getItem<Record<string, TaskData>>(COLLECTION_NAME) || {};
    return Object.values(all).filter(t => t.witel === witel);
  }

  const q = query(collection(db, COLLECTION_NAME), where("witel", "==", witel));
  const querySnapshot = await getDocs(q);
  const tasks: TaskData[] = [];
  querySnapshot.forEach((doc) => {
    tasks.push(doc.data() as TaskData);
  });
  return tasks;
}

export async function getAllTasks(): Promise<TaskData[]> {
  if (isLocalMode()) {
    const all = await localforage.getItem<Record<string, TaskData>>(COLLECTION_NAME) || {};
    return Object.values(all);
  }

  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  const tasks: TaskData[] = [];
  querySnapshot.forEach((doc) => {
    tasks.push(doc.data() as TaskData);
  });
  return tasks;
}

const GOOGLE_SHEETS_WEBHOOK_URL = import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL || "https://script.google.com/macros/s/AKfycby0jct0vhgp_Z31Zol3LtL-QU63jG8ZkgBRJk2TdSz0cEmyeOmwBxL1jqwcDAc6AecRkA/exec";

export async function syncToGoogleSheets(task: Partial<TaskData>) {
  const url = GOOGLE_SHEETS_WEBHOOK_URL;
  if (!url || !task) return;

  try {
    const payload = {
      orderId: task.order || task.id || '',
      order: task.order || task.id || '',
      id: task.id || task.order || '',
      woId: task.woId || '-',
      nik: task.nik || '-',
      customerName: task.customerName || '-',
      sto: task.sto || '-',
      witel: task.witel || '-',
      trackerStatus: task.trackerStatus || 'Pending',
      technicianName: task.technicianName || '-',
      notes: task.notes || '-',
      statusResume: task.statusResume || '-',
      statusMessage: task.statusMessage || '-',
      updatedAt: task.updatedAt || new Date().toISOString(),
      updatedBy: task.updatedBy || '-'
    };

    fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    }).catch(err => console.error('Google Sheets web sync error:', err));
  } catch (e) {
    console.error('Failed to trigger Google Sheets web sync:', e);
  }
}

export async function syncBulkToGoogleSheets(tasks: TaskData[]) {
  const url = GOOGLE_SHEETS_WEBHOOK_URL;
  if (!url || !tasks || tasks.length === 0) return null;

  try {
    const payload = tasks.map(task => ({
      orderId: task.order || task.id || '',
      order: task.order || task.id || '',
      id: task.id || task.order || '',
      woId: task.woId || '-',
      nik: task.nik || '-',
      customerName: task.customerName || '-',
      sto: task.sto || '-',
      witel: task.witel || '-',
      trackerStatus: task.trackerStatus || 'Pending',
      technicianName: task.technicianName || '-',
      notes: task.notes || '-',
      statusResume: task.statusResume || '-',
      statusMessage: task.statusMessage || '-',
      updatedAt: task.updatedAt || new Date().toISOString(),
      updatedBy: task.updatedBy || '-'
    }));

    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ bulkTasks: payload })
    });
    return { status: 'success' };
  } catch (e) {
    console.error('Failed to trigger bulk Google Sheets web sync:', e);
    return null;
  }
}

export async function updateTaskStatus(id: string, updates: Partial<TaskData>) {
  if (isLocalMode()) {
    const all = await localforage.getItem<Record<string, TaskData>>(COLLECTION_NAME) || {};
    if (all[id]) {
      all[id] = { ...all[id], ...updates, updatedAt: new Date().toISOString() };
      await localforage.setItem(COLLECTION_NAME, all);
      syncToGoogleSheets(all[id]);
    }
    return;
  }

  const docRef = doc(db, COLLECTION_NAME, id);
  const updatedAt = new Date().toISOString();
  await updateDoc(docRef, {
    ...updates,
    updatedAt: updatedAt
  });

  try {
    const all = await getAllTasks();
    const found = all.find(t => t.id === id || t.order === id);
    if (found) {
      syncToGoogleSheets(found);
    }
  } catch (e) {
    console.error('Error fetching updated task for Google Sheets web sync:', e);
  }
}
