import { getAllTasks, getAllRecipientChatIds } from './db';

const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || "";
const BOT_REMINDER_API = import.meta.env.VITE_TELEGRAM_BOT_URL || "https://ebis-bot.vercel.app/api/reminder";

export function formatDailyReminderTextWeb(tasks: any[]) {
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

  const grouped: Record<string, Record<string, any>> = {};
  const overall = { Total: 0, Pending: 0, 'On Progress': 0, Kendala: 0, Cancel: 0, Completed: 0 };

  tasks.forEach(t => {
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

  let text = `<b>🔔 REMINDER DAFTAR WORK ORDER EBIS</b>\n` +
    `📅 <i>${dateStr} • Manual Trigger</i>\n` +
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

  text += `═════════════════════════\n` +
    `<b>📊 TOTAL RINGKASAN:</b>\n` +
    `Total: <b>${overall.Total} Order</b> | ⏳ Pend: <b>${overall.Pending}</b> | 🚧 Prog: <b>${overall['On Progress']}</b> | ⚠️ Kdl: <b>${overall.Kendala}</b> | ✅ Comp: <b>${overall.Completed}</b>\n` +
    `─────────────────────────\n` +
    `<i>Gunakan command <code>/cek &lt;STO&gt; [status]</code> untuk cek detail.</i>`;

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
    const recipientIds = await getAllRecipientChatIds();

    if (recipientIds.length === 0) {
      return {
        success: false,
        count: 0,
        message: 'Belum ada pengguna Telegram yang terdaftar di bot.'
      };
    }

    const text = formatDailyReminderTextWeb(targetTasks);
    let successCount = 0;

    for (const chatId of recipientIds) {
      try {
        const resp = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML'
          })
        });
        if (resp.ok) successCount++;
      } catch (e) {
        console.error(`Failed sending to ${chatId}:`, e);
      }
    }

    if (successCount > 0) {
      return {
        success: true,
        count: successCount,
        message: `Reminder manual terkirim ke ${successCount} dari ${recipientIds.length} pengguna Telegram!`
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
