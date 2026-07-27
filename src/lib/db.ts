import { db } from "./firebase";
import { collection, getDocs, doc, getDoc, setDoc, query, where, writeBatch, deleteDoc } from "firebase/firestore";
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
  isAnomaly?: boolean;
}

const COLLECTION_NAME = "ebis_tasks";

function isLocalMode() {
  return !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === "dummy-api-key";
}

export async function importDataToFirestore(dataList: any[]): Promise<{ added: number, duplicates: number, addedItems: any[], updatedItems: any[], skippedItems: any[] }> {
  let added = 0;
  let duplicates = 0;
  const addedItems: any[] = [];
  const updatedItems: any[] = [];
  const skippedItems: any[] = [];

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
        addedItems.push(item);
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
          updatedItems.push(item);
        } else {
          skippedItems.push(item);
        }
      }
    });
    await localforage.setItem(COLLECTION_NAME, existing);
    return { added, duplicates, addedItems, updatedItems, skippedItems };
  }
  
  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  const compSnapshot = await getDocs(collection(db, "ebis_tasks_completed"));
  const existingDocs = new Map<string, TaskData>();
  querySnapshot.forEach(d => existingDocs.set(d.id, d.data() as TaskData));
  compSnapshot.forEach(d => existingDocs.set(d.id, d.data() as TaskData));

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
        updatedItems.push(item);
        const targetCollection = isCompleted ? "ebis_tasks_completed" : COLLECTION_NAME;
        const docRef = doc(db, targetCollection, orderId);
        
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
          batch.delete(doc(db, COLLECTION_NAME, orderId)); // Ensure removed from active
        } else {
          batch.delete(doc(db, "ebis_tasks_completed", orderId)); // Ensure removed from completed
        }

        batch.set(docRef, updateData, { merge: true });
        batchCount++;
      } else {
        skippedItems.push(item);
      }
    } else {
      added++;
      addedItems.push(item);
      existingDocs.set(orderId, {} as TaskData); // avoid counting duplicates within same json
      
      const targetCollection = isCompleted ? "ebis_tasks_completed" : COLLECTION_NAME;
      const docRef = doc(db, targetCollection, orderId);
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
    // Auto-sync to Google Sheets in background after Excel import!
    try {
      const allTasks = await getAllTasks();
      syncBulkToGoogleSheets(allTasks);
    } catch (e) {
      console.error("Auto Google Sheets sync after import error:", e);
    }
  }
  
  return { added, duplicates, addedItems, updatedItems, skippedItems };
}

export async function getTasksByWitel(witel: string): Promise<TaskData[]> {
  if (witel === "ALL" || !witel) {
    return getAllTasks();
  }

  if (isLocalMode()) {
    const all = await localforage.getItem<Record<string, TaskData>>(COLLECTION_NAME) || {};
    return Object.values(all).filter(t => t.witel === witel);
  }

  const q1 = query(collection(db, COLLECTION_NAME), where("witel", "==", witel));
  const q2 = query(collection(db, "ebis_tasks_completed"), where("witel", "==", witel));
  
  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  
  const tasks: TaskData[] = [];
  snap1.forEach((doc) => tasks.push(doc.data() as TaskData));
  snap2.forEach((doc) => tasks.push(doc.data() as TaskData));
  return tasks;
}

export async function getAllTasks(): Promise<TaskData[]> {
  if (isLocalMode()) {
    const all = await localforage.getItem<Record<string, TaskData>>(COLLECTION_NAME) || {};
    return Object.values(all);
  }

  const [snap1, snap2] = await Promise.all([
    getDocs(collection(db, COLLECTION_NAME)),
    getDocs(collection(db, "ebis_tasks_completed"))
  ]);
  
  const tasks: TaskData[] = [];
  snap1.forEach((doc) => tasks.push(doc.data() as TaskData));
  snap2.forEach((doc) => tasks.push(doc.data() as TaskData));
  return tasks;
}

const GOOGLE_SHEETS_WEBHOOK_URL = import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL || "";

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
      updatedAt: (task.updatedBy && task.updatedBy !== '-') 
                   ? (task.updatedAt || new Date().toISOString()) 
                   : (task.orderDate || task.updatedAt || new Date().toISOString()),
      updatedBy: task.updatedBy || '-',
      isAnomaly: task.isAnomaly || false
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
  if (!url) return null;

  try {
    let anomalies: TaskData[] = [];
    if (!isLocalMode()) {
      const q = await getDocs(collection(db, "ebis_tasks_anomaly"));
      q.forEach(d => anomalies.push(d.data() as TaskData));
    } else {
      const all = await localforage.getItem<Record<string, TaskData>>('ebis_tasks_anomaly') || {};
      anomalies = Object.values(all);
    }

    const allTasksToSync = [...tasks, ...anomalies];
    if (allTasksToSync.length === 0) return null;

    const payload = allTasksToSync.map(task => ({
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
      updatedAt: (task.updatedBy && task.updatedBy !== '-') 
                   ? (task.updatedAt || new Date().toISOString()) 
                   : (task.orderDate || task.updatedAt || new Date().toISOString()),
      updatedBy: task.updatedBy || '-',
      isAnomaly: task.isAnomaly || false
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

  // Find the task first
  let docRef = doc(db, COLLECTION_NAME, id);
  let docSnap = await getDoc(docRef);
  let isCompletedCollection = false;
  
  if (!docSnap.exists()) {
    docRef = doc(db, "ebis_tasks_completed", id);
    docSnap = await getDoc(docRef);
    isCompletedCollection = true;
  }

  if (!docSnap.exists()) return; // Not found
  
  const updatedAt = new Date().toISOString();
  const existingData = docSnap.data();
  const newData = { ...existingData, ...updates, updatedAt };

  if (updates.trackerStatus === 'Completed') {
    await setDoc(doc(db, "ebis_tasks_completed", id), newData);
    if (!isCompletedCollection) await deleteDoc(doc(db, COLLECTION_NAME, id));
  } else {
    await setDoc(doc(db, COLLECTION_NAME, id), newData);
    if (isCompletedCollection) await deleteDoc(doc(db, "ebis_tasks_completed", id));
  }

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

export async function hideTaskToAnomaly(id: string): Promise<void> {
  if (isLocalMode()) {
    const all = await localforage.getItem<Record<string, TaskData>>(COLLECTION_NAME) || {};
    if (all[id]) {
      const anomalyAll = await localforage.getItem<Record<string, TaskData>>('ebis_tasks_anomaly') || {};
      anomalyAll[id] = { ...all[id], trackerStatus: 'Cancel', notes: 'Hidden/Anomali' };
      await localforage.setItem('ebis_tasks_anomaly', anomalyAll);
      delete all[id];
      await localforage.setItem(COLLECTION_NAME, all);
      
      // Trigger sync for anomaly
      const anomalyTask = { ...anomalyAll[id], isAnomaly: true };
      syncToGoogleSheets(anomalyTask);
    }
    return;
  }
  
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const taskData = docSnap.data() as TaskData;
    
    // Save to anomaly collection
    const anomalyDocRef = doc(db, 'ebis_tasks_anomaly', id);
    await setDoc(anomalyDocRef, {
      ...taskData,
      isAnomaly: true,
      hiddenAt: new Date().toISOString()
    });
    
    // Delete from main collection
    await deleteDoc(docRef);
    
    // Trigger webhook
    syncToGoogleSheets({ ...taskData, isAnomaly: true, trackerStatus: 'Cancel' });
  }
}

export async function getAllTechnicians(): Promise<any[]> {
  if (isLocalMode()) return [];
  try {
    const querySnapshot = await getDocs(collection(db, "ebis_technicians"));
    const techs: any[] = [];
    querySnapshot.forEach((d) => techs.push(d.data()));
    return techs;
  } catch (e) {
    console.error("Failed to fetch technicians:", e);
    return [];
  }
}

export async function getAllRecipientProfiles(): Promise<any[]> {
  if (isLocalMode()) return [];
  const profilesMap = new Map<string, any>();
  const usernameToTech = new Map<string, any>();

  try {
    const techSnap = await getDocs(collection(db, "ebis_technicians"));
    techSnap.forEach(d => {
      const data = d.data();
      const cleanUser = data.username ? String(data.username).replace(/^@/, '').trim().toLowerCase() : '';
      const rawChatId = data.chatId ? String(data.chatId).trim() : '';

      const techObj = {
        chatId: /^\d+$/.test(rawChatId) ? rawChatId : '',
        name: data.name || '',
        username: cleanUser ? `@${cleanUser}` : (data.username || ''),
        sto: (data.sto || '').toUpperCase().trim(),
        witel: (data.witel || '').toUpperCase().trim()
      };

      if (techObj.chatId) {
        profilesMap.set(techObj.chatId, techObj);
      }
      if (cleanUser) {
        usernameToTech.set(cleanUser, techObj);
      }
    });

    const chatSnap = await getDocs(collection(db, "ebis_chats"));
    chatSnap.forEach(d => {
      const data = d.data();
      const rawChatId = data.chatId ? String(data.chatId).trim() : '';
      if (!/^\d+$/.test(rawChatId)) return;

      const cleanUser = data.username ? String(data.username).replace(/^@/, '').trim().toLowerCase() : '';

      let existing = profilesMap.get(rawChatId);
      if (!existing && cleanUser && usernameToTech.has(cleanUser)) {
        existing = usernameToTech.get(cleanUser);
      }

      const mergedProfile = {
        chatId: rawChatId,
        name: data.name || existing?.name || '',
        username: data.username || existing?.username || '',
        sto: existing?.sto || (data.sto || '').toUpperCase().trim(),
        witel: data.witel || existing?.witel || ''
      };

      profilesMap.set(rawChatId, mergedProfile);
    });
  } catch (e) {
    console.error("Failed to fetch recipient profiles:", e);
  }

  return Array.from(profilesMap.values()).filter(p => /^\d+$/.test(p.chatId));
}

export async function getAllRecipientChatIds(): Promise<string[]> {
  const profiles = await getAllRecipientProfiles();
  return profiles.map(p => p.chatId);
}

export async function getAdminAuth(): Promise<{ username: string; password: string }> {
  const defaultAuth = { username: "admin", password: "ebis902544604" };
  if (isLocalMode()) return defaultAuth;

  try {
    const docRef = doc(db, "ebis_config", "admin_auth");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        username: data.username || "admin",
        password: data.password || "ebis902544604"
      };
    } else {
      await setDoc(docRef, defaultAuth);
      return defaultAuth;
    }
  } catch (e) {
    console.error("Failed to fetch admin auth from Firestore:", e);
    return defaultAuth;
  }
}

export async function verifyAdminLogin(inputUser: string, inputPass: string): Promise<boolean> {
  const cleanInputUser = inputUser.trim().toLowerCase();
  const cleanInputPass = inputPass.trim();

  if (!cleanInputUser || !cleanInputPass) return false;

  if (isLocalMode()) {
    return (cleanInputUser === "admin" || cleanInputUser === "admin2") && 
           (cleanInputPass === "ebis902544604" || cleanInputPass === "pass123");
  }

  try {
    // 1. Check ebis_admins collection for specific username document
    const docRef = doc(db, "ebis_admins", cleanInputUser);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.password && data.password.trim() === cleanInputPass) {
        return true;
      }
    }

    // 2. Check legacy ebis_config/admin_auth
    const legacyAuth = await getAdminAuth();
    if (cleanInputUser === (legacyAuth.username || "admin").toLowerCase() && cleanInputPass === legacyAuth.password.trim()) {
      return true;
    }

    // 3. Fallback default account
    if (cleanInputUser === "admin" && cleanInputPass === "ebis902544604") {
      return true;
    }
  } catch (e) {
    console.error("Error verifying admin login:", e);
  }

  return false;
}
