import { db } from './db';
import { getEscalatingReminder } from './ai';

// ── Permission ────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
        console.warn('Notifications not supported');
        return false;
    }

    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

// ── Send Notification ─────────────────────────────
export function sendNotification(title: string, body: string, tag?: string) {
    if (Notification.permission !== 'granted') return;

    const notification = new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        tag: tag || 'ofelia-reminder',
    });

    notification.onclick = () => {
        window.focus();
        notification.close();
    };
}

// ── Reminder Checker ──────────────────────────────
// Tracks how many times we've reminded for each task
const reminderCounts: { [taskId: number]: number } = {};

function parseTime(timeStr: string): { hours: number; minutes: number } | null {
    // Parse "9:00 AM", "2:30 PM", etc.
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return null;

    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return { hours, minutes };
}

export async function checkAndSendReminders() {
    const tasks = await db.tasks.where('status').equals('pending').toArray();
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    for (const task of tasks) {
        const parsed = parseTime(task.scheduledTime);
        if (!parsed) continue;

        // Check if it's time (or past time) for this task
        const taskMinutesTotal = parsed.hours * 60 + parsed.minutes;
        const currentMinutesTotal = currentHours * 60 + currentMinutes;

        if (currentMinutesTotal >= taskMinutesTotal) {
            const id = task.id!;
            const count = reminderCounts[id] || 0;

            // Send reminder every 15 minutes, up to 5 times
            if (count < 5) {
                const message = getEscalatingReminder(task.text, count);
                sendNotification('OfeLia 🔥', message, `task-${id}`);
                reminderCounts[id] = count + 1;
            }
        }
    }
}

// ── Start Reminder Loop ───────────────────────────
let reminderInterval: ReturnType<typeof setInterval> | null = null;

export function startReminderLoop() {
    if (reminderInterval) return; // Already running

    // Check every 15 minutes
    reminderInterval = setInterval(checkAndSendReminders, 15 * 60 * 1000);

    // Also check immediately
    checkAndSendReminders();
}

export function stopReminderLoop() {
    if (reminderInterval) {
        clearInterval(reminderInterval);
        reminderInterval = null;
    }
}
