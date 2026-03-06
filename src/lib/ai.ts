import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatMessage } from './db';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// ── Rate Limiting ─────────────────────────────────
const RATE_LIMIT = {
    maxPerMinute: 10,
    maxPerDay: 150,
    timestamps: [] as number[],
    dailyCount: 0,
    dailyResetDate: ''
};

function checkRateLimit(): boolean {
    const now = Date.now();
    const today = new Date().toDateString();

    if (RATE_LIMIT.dailyResetDate !== today) {
        RATE_LIMIT.dailyCount = 0;
        RATE_LIMIT.dailyResetDate = today;
    }

    RATE_LIMIT.timestamps = RATE_LIMIT.timestamps.filter(t => now - t < 60000);

    if (RATE_LIMIT.timestamps.length >= RATE_LIMIT.maxPerMinute) return false;
    if (RATE_LIMIT.dailyCount >= RATE_LIMIT.maxPerDay) return false;

    RATE_LIMIT.timestamps.push(now);
    RATE_LIMIT.dailyCount++;
    return true;
}

// ── System Prompt ─────────────────────────────────
const SYSTEM_PROMPT = `You are OfeLia, a strict but caring AI accountability buddy.

## Your Personality:
- You are a TOUGH BEST FRIEND who genuinely cares
- STRICT about follow-through
- Celebrate genuine effort with real enthusiasm
- Call out excuses lovingly but firmly
- Use emojis naturally but not excessively
- Keep messages SHORT (2-3 sentences max)
- Speak casually, like a close friend texting

## Task Scheduling:
When the user tells you their tasks, respond with JSON like this:
{"message": "Your response", "tasks": [{"text": "Task", "scheduledTime": "9:00 AM", "estimatedMinutes": 60}]}

If just chatting (no tasks), respond with:
{"message": "Your response", "tasks": []}

IMPORTANT: ALWAYS respond in valid JSON only. No markdown, no code blocks, no extra text.`;

// ── Main AI Function ──────────────────────────────
export async function chatWithOfeLia(
    userMessage: string,
    recentMessages: ChatMessage[] = []
): Promise<{ message: string; tasks: { text: string; scheduledTime: string; estimatedMinutes: number }[] }> {

    if (!checkRateLimit()) {
        return { message: "Slow down! Try again in a minute 😅", tasks: [] };
    }

    if (!apiKey) {
        return { message: "No API key found 😵 Check .env.local!", tasks: [] };
    }

    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            systemInstruction: SYSTEM_PROMPT,
            generationConfig: { temperature: 0.8, maxOutputTokens: 500 }
        });

        // Build context as a single prompt (avoids history ordering issues)
        let context = '';
        if (recentMessages.length > 0) {
            const recent = recentMessages.slice(-6).map(m =>
                `${m.role === 'user' ? 'User' : 'OfeLia'}: ${m.content}`
            ).join('\n');
            context = `Recent conversation:\n${recent}\n\n`;
        }

        const result = await model.generateContent(`${context}User: ${userMessage}`);
        const raw = result.response.text();
        console.log('OfeLia raw:', raw);

        return parseAIResponse(raw);
    } catch (err: unknown) {
        console.error('OfeLia AI Error:', err);
        const msg = err instanceof Error ? err.message : String(err);

        if (msg.includes('429') || msg.includes('quota')) {
            return { message: "I've hit my daily thinking limit 😴 Try again in a few minutes, or get a new API key from ai.google.dev!", tasks: [] };
        }
        return { message: "My brain glitched 🫠 Try again?", tasks: [] };
    }
}

function parseAIResponse(raw: string): { message: string; tasks: { text: string; scheduledTime: string; estimatedMinutes: number }[] } {
    try {
        let cleaned = raw.trim();
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }
        const parsed = JSON.parse(cleaned);
        return { message: parsed.message || "Got it!", tasks: parsed.tasks || [] };
    } catch {
        return { message: raw, tasks: [] };
    }
}

// ── Reminder Messages ─────────────────────────────
export function getEscalatingReminder(taskText: string, reminderCount: number): string {
    const reminders = [
        `Hey! Time for "${taskText}" 💙 You got this!`,
        `Still waiting on "${taskText}"... You said you'd do this 😐`,
        `"${taskText}" won't do itself. Let's go! 😤`,
        `Not going away until you do "${taskText}". Photo proof please 📸`,
        `LAST CALL: "${taskText}". Do it NOW. 🔥`
    ];
    return reminders[Math.min(reminderCount, reminders.length - 1)];
}
