import { getAllTasks, getAllRecipientProfiles } from './db';

const DEFAULT_BOT_TOKEN = typeof window !== 'undefined' && typeof window.atob === 'function'
  ? atob("ODg0NDg5ODMzNzpBQUhNSEx5ekxjVU42Wm5uaFRvTko5UXhkWWRBc256UHM=")
  : "";

const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
const BOT_REMINDER_API = import.meta.env.VITE_TELEGRAM_BOT_URL || "https://ebis-bot.vercel.app/api/reminder";

export function formatDailyReminderTextWeb(tasks: any[], userProfile: any = null) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  });

  if (!tasks || tasks.length === 0) {
    return `<b>🔔 REMINDER DAFTAR WORK ORDER EBIS</b>\n` +
      `📅 <i>${dateStr} • Manual Trigger</i>\n` +
      `═════════════════════════\n\n` +
      `<i>Belum ada data work order aktif.</i>`;
  }

  let targetWitel: string | null = null;
  if (userProfile) {
    if (userProfile.witel && userProfile.witel !== 'ALL') {
      targetWitel = userProfile.witel.toUpperCase().trim();
    } else if (userProfile.sto && userProfile.sto !== 'ALL') {
      const matchTask = tasks.find(t => t.sto && t.sto.toUpperCase().trim() === userProfile.sto.toUpperCase());
      if (matchTask && matchTask.witel) {
        targetWitel = matchTask.witel.toUpperCase().trim();
      }
    }
  }

  let filteredTasks = tasks;
  if (targetWitel) {
    const matched = tasks.filter(t => (t.witel || '').toUpperCase().trim() === targetWitel);
    if (matched.length > 0) {
      filteredTasks = matched;
    } else {
      targetWitel = null;
    }
  }

  const grouped: Record<string, Record<string, any>> = {};
  const overall = { Total: 0, Pending: 0, 'On Progress': 0, Kendala: 0, Cancel: 0, Completed: 0 };

  filteredTasks.forEach(t => {
    const witel = (t.witel || 'WITEL LAIN').toUpperCase().trim();
    const sto = (t.sto || 'UMUM').toUpperCase().trim();
    const status = t.trackerStatus || 'Pending';

    overall.Total++;
    if ((overall as any)[status] !== undefined) (overall as any)[status]++;

    if (!grouped[witel]) grouped[witel] = {};
    if (!grouped[witel][sto]) {
      grouped[witel][sto] = {
        total: 0,
        pending: [],
        progress: [],
        kendala: [],
        cancel: [],
        completed: 0
      };
    }

    const stData = grouped[witel][sto];
    stData.total++;

    const orderId = t.order || t.id;
    const noteSnippet = t.notes ? ` (${t.notes.substring(0, 25)}${t.notes.length > 25 ? '...' : ''})` : '';

    if (status === 'Pending') stData.pending.push(orderId);
    else if (status === 'On Progress') stData.progress.push(orderId);
    else if (status === 'Kendala') stData.kendala.push(`${orderId}${noteSnippet}`);
    else if (status === 'Cancel') stData.cancel.push(orderId);
    else if (status === 'Completed') stData.completed++;
  });

  const headerTitle = targetWitel
    ? `<b>🔔 REMINDER WORK ORDER WITEL ${targetWitel}</b>`
    : `<b>🔔 REMINDER WORK ORDER EBIS</b>`;

  const stoTag = userProfile?.sto ? ` • STO <code>${userProfile.sto}</code>` : '';

  let text = `${headerTitle}\n` +
    `📅 <i>${dateStr} • Manual Trigger${stoTag}</i>\n` +
    `═════════════════════════\n\n`;

  const witelKeys = Object.keys(grouped).sort();

  witelKeys.forEach(witel => {
    text += `<b>📍 WITEL ${witel}</b>\n`;
    const stoKeys = Object.keys(grouped[witel]).sort();

    stoKeys.forEach(sto => {
      const st = grouped[witel][sto];
      text += `  <b>STO ${sto}:</b>\n` +
        `  • Total: <b>${st.total}</b> | ⏳ Pend: ${st.pending.length} | 🚧 Prog: ${st.progress.length} | ⚠️ Kdl: ${st.kendala.length}\n`;

      if (st.pending.length > 0) {
        const pList = st.pending.slice(0, 5).map((id: string) => `<code>${id}</code>`).join(', ');
        const moreP = st.pending.length > 5 ? ` (+${st.pending.length - 5} order)` : '';
        text += `  • ⏳ Pending: ${pList}${moreP}\n`;
      }

      if (st.kendala.length > 0) {
        const kList = st.kendala.slice(0, 3).map((k: string) => `<code>${k}</code>`).join(', ');
        const moreK = st.kendala.length > 3 ? ` (+${st.kendala.length - 3} order)` : '';
        text += `  • ⚠️ Kendala: ${kList}${moreK}\n`;
      }
    });

    text += `\n`;
  });

  const summaryTitle = targetWitel ? `RINGKASAN WITEL ${targetWitel}` : `TOTAL RINGKASAN`;

  text += `═════════════════════════\n` +
    `<b>📊 ${summaryTitle}:</b>\n` +
    `Total: <b>${overall.Total} Order</b> | ⏳ Pend: <b>${overall.Pending}</b> | 🚧 Prog: <b>${overall['On Progress']}</b> | ⚠️ Kdl: <b>${overall.Kendala}</b> | ✅ Comp: <b>${overall.Completed}</b>\n` +
    `─────────────────────────\n` +
    `<i>Ketik <code>/setwitel &lt;WITEL|ALL&gt;</code> untuk mengatur filter Witel.</i>`;

  return text;
}

export async function sendTelegramManualReminder(filteredTasks?: any[]): Promise<{ success: boolean; count: number; message: string }> {
  // 1. Try bot server API endpoint first
  try {
    const res = await fetch(BOT_REMINDER_API, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      if (data.details?.successCount > 0) {
        return {
          success: true,
          count: data.details.successCount,
          message: `Berhasil terkirim ke ${data.details.successCount} pengguna Telegram via Bot Server!`
        };
      }
    }
  } catch (err) {
    console.warn('Bot API server offline or unreachable, falling back to direct Telegram API broadcast...');
  }

  // 2. Fallback: Broadcast directly from web app using Telegram API
  try {
    const targetTasks = filteredTasks && filteredTasks.length > 0 ? filteredTasks : await getAllTasks();
    const recipientProfiles = await getAllRecipientProfiles();

    if (recipientProfiles.length === 0) {
      return {
        success: false,
        count: 0,
        message: 'Belum ada pengguna Telegram yang terdaftar di bot.'
      };
    }

    let successCount = 0;

    for (const profile of recipientProfiles) {
      try {
        const text = formatDailyReminderTextWeb(targetTasks, profile);
        const resp = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: profile.chatId,
            text: text,
            parse_mode: 'HTML'
          })
        });
        if (resp.ok) successCount++;
      } catch (e) {
        console.error(`Failed sending to ${profile.chatId}:`, e);
      }
    }

    if (successCount > 0) {
      return {
        success: true,
        count: successCount,
        message: `Reminder manual terkirim ke ${successCount} dari ${recipientProfiles.length} pengguna Telegram (sesuai Witel masing-masing)!`
      };
    } else {
      return {
        success: false,
        count: 0,
        message: 'Gagal mengirim reminder ke pengguna Telegram.'
      };
    }
  } catch (e: any) {
    return {
      success: false,
      count: 0,
      message: `Terjadi kesalahan saat mengirim reminder: ${e.message}`
    };
  }
}
