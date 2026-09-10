const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const taskService = require('./taskService');
const habitService = require('./habitService');
const habitLogService = require('./habitLogService');
const noteService = require('./noteService');
const reminderService = require('./reminderService');
const calendarEventService = require('./calendarEventService');
const settingsService = require('./settingsService');
const { getLocalDateString } = require('../utils/profileTime');

const PRESET_MODELS = {
    openai: [
        { id: 'gpt-4o', name: 'GPT-4o (Flagship Omni)' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Efficient)' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        { id: 'o3-mini', name: 'o3-mini (Reasoning)' },
        { id: 'o1', name: 'o1 (Advanced Reasoning)' },
    ],
    gemini: [
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Fastest)' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Deep Context)' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
        { id: 'gemini-2.0-flash-lite-preview-02-05', name: 'Gemini 2.0 Flash-Lite' },
    ],
    ollama_cloud: [
        { id: 'qwen2.5:latest', name: 'Qwen 2.5 (Fast & Smart)' },
        { id: 'llama3.3:latest', name: 'Llama 3.3' },
        { id: 'deepseek-r1:latest', name: 'DeepSeek R1' },
    ],
    custom: [
        { id: 'default', name: 'Custom Model' },
    ],
};

const DEFAULT_ENDPOINTS = {
    openai: 'https://api.openai.com/v1',
    gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
    ollama_cloud: 'https://ollama.com/v1',
    custom: 'http://localhost:11434/v1',
};

/**
 * Builds a structured markdown snapshot of the user's second brain
 */
async function buildProfileContext(profileId) {
    const settings = await settingsService.getSettings(profileId) || { timezone: 'UTC', week_starts_on: 0 };
    const tz = settings.timezone || 'UTC';
    const weekStartsOn = settings.week_starts_on ?? 0;
    const today = getLocalDateString(tz, new Date());

    const [tasks, habits, notes, reminders, events, logs] = await Promise.all([
        taskService.listTasks(profileId).catch(() => []),
        habitService.listHabits(profileId).catch(() => []),
        noteService.listNotes(profileId).catch(() => []),
        reminderService.listReminders(profileId).catch(() => []),
        calendarEventService.listCalendarEvents(profileId).catch(() => []),
        habitService.getCompletedLogs(profileId).catch(() => []),
    ]);

    const logIndex = habitService.buildHabitLogIndex(logs);
    const habitsWithStreaks = habits.map(h => {
        const dates = logIndex.get(h.id) || new Set();
        const streak = habitService.computeStreakForDates(dates, h.target_per_week, tz, weekStartsOn);
        return { ...h, current_streak: streak };
    });

    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const doneTasks = tasks.filter(t => t.status === 'done');

    const doFirst = pendingTasks.filter(t => t.urgent && t.important);
    const schedule = pendingTasks.filter(t => !t.urgent && t.important);
    const delegate = pendingTasks.filter(t => t.urgent && !t.important);
    const eliminate = pendingTasks.filter(t => !t.urgent && !t.important);

    let summary = `### User Context (Second Brain Snapshot)\n`;
    summary += `- **Date Today:** ${today} (${tz})\n\n`;

    summary += `#### 📋 Tasks (Eisenhower Matrix)\n`;
    summary += `**1. Do First (Urgent & Important):**\n`;
    if (doFirst.length === 0) summary += `  *(None)*\n`;
    else doFirst.forEach(t => summary += `  - [ ] [ID: ${t.id}] ${t.title}${t.due_at ? ` (Due: ${t.due_at})` : ''}\n`);

    summary += `**2. Schedule (Important, Not Urgent):**\n`;
    if (schedule.length === 0) summary += `  *(None)*\n`;
    else schedule.forEach(t => summary += `  - [ ] [ID: ${t.id}] ${t.title}${t.due_at ? ` (Due: ${t.due_at})` : ''}\n`);

    summary += `**3. Delegate (Urgent, Not Important):**\n`;
    if (delegate.length === 0) summary += `  *(None)*\n`;
    else delegate.forEach(t => summary += `  - [ ] [ID: ${t.id}] ${t.title}\n`);

    summary += `**4. Eliminate (Not Urgent & Not Important):**\n`;
    if (eliminate.length === 0) summary += `  *(None)*\n`;
    else eliminate.forEach(t => summary += `  - [ ] [ID: ${t.id}] ${t.title}\n`);

    summary += `\n#### ⚡ Habits & Streaks\n`;
    if (habitsWithStreaks.length === 0) {
        summary += `*(No habits configured)*\n`;
    } else {
        habitsWithStreaks.forEach(h => {
            summary += `- [ID: ${h.id}] **${h.title}**: ${h.current_streak}d streak (Target: ${h.target_per_week}x/week)\n`;
        });
    }

    summary += `\n#### 📝 Recent Notes (Top 5)\n`;
    if (notes.length === 0) {
        summary += `*(No notes recorded)*\n`;
    } else {
        notes.slice(0, 5).forEach(n => {
            const preview = (n.content || '').replace(/\n+/g, ' ').slice(0, 100);
            summary += `- [ID: ${n.id}] ${preview}...\n`;
        });
    }

    summary += `\n#### 📅 Upcoming Calendar Events\n`;
    const activeEvents = events.filter(e => !e.ends_at || e.ends_at >= today).slice(0, 5);
    if (activeEvents.length === 0) {
        summary += `*(No upcoming events)*\n`;
    } else {
        activeEvents.forEach(e => {
            summary += `- [ID: ${e.id}] **${e.title}**: ${e.starts_at || 'N/A'}\n`;
        });
    }

    summary += `\n#### ⏰ Active Reminders\n`;
    const pendingReminders = reminders.filter(r => !r.is_done).slice(0, 5);
    if (pendingReminders.length === 0) {
        summary += `*(No pending reminders)*\n`;
    } else {
        pendingReminders.forEach(r => {
            summary += `- [ID: ${r.id}] ${r.title} (${r.remind_at})\n`;
        });
    }

    return summary;
}

/**
 * Definition of AI Assistant Tools (OpenAI Function Calling schema)
 */
const AI_TOOLS = [
    // --- Tasks ---
    {
        type: 'function',
        function: {
            name: 'create_task',
            description: 'Create a new task with priority matrix flags and optional due date.',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string', description: 'The task title or action required' },
                    description: { type: 'string', description: 'Details, notes, steps, or budget links' },
                    urgent: { type: 'boolean', description: 'Whether the task is urgent (Eisenhower Matrix)' },
                    important: { type: 'boolean', description: 'Whether the task is important (Eisenhower Matrix)' },
                    due_at: { type: 'string', description: 'Due date & time in ISO format or YYYY-MM-DDTHH:mm' },
                },
                required: ['title'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'list_tasks',
            description: 'List current tasks filtered by status or search keyword.',
            parameters: {
                type: 'object',
                properties: {
                    status: { type: 'string', enum: ['pending', 'done', 'all'], description: 'Filter by task status' },
                    search: { type: 'string', description: 'Keyword to search in task title or description' },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'update_task',
            description: 'Update any combination of title, description, priority matrix flags, due date, or status on an existing task.',
            parameters: {
                type: 'object',
                properties: {
                    task_id: { type: 'string', description: 'The task ID (if known)' },
                    name: { type: 'string', description: 'Task title or keywords to identify the task if task_id is unknown' },
                    title: { type: 'string', description: 'Updated title of the task' },
                    description: { type: 'string', description: 'Updated description, notes, or links' },
                    urgent: { type: 'boolean', description: 'Updated urgent flag' },
                    important: { type: 'boolean', description: 'Updated important flag' },
                    due_at: { type: 'string', description: 'Updated due date (ISO string or YYYY-MM-DD)' },
                    status: { type: 'string', enum: ['pending', 'done'], description: 'Updated status' },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'delete_task',
            description: 'Soft-delete or move a task to Trash.',
            parameters: {
                type: 'object',
                properties: {
                    task_id: { type: 'string', description: 'The task ID' },
                    name: { type: 'string', description: 'Task title keywords to identify the task' },
                },
            },
        },
    },

    // --- Notes ---
    {
        type: 'function',
        function: {
            name: 'create_note',
            description: 'Save a note, thought, meeting record, or idea into the Knowledge base.',
            parameters: {
                type: 'object',
                properties: {
                    content: { type: 'string', description: 'Note text content in markdown' },
                    tags: { type: 'array', items: { type: 'string' }, description: 'Tags like ["work", "ideas"]' },
                },
                required: ['content'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'list_notes',
            description: 'Search or retrieve existing notes from the second brain.',
            parameters: {
                type: 'object',
                properties: {
                    search: { type: 'string', description: 'Search keywords' },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'update_note',
            description: 'Update note content, append new thoughts, or replace tags on an existing note.',
            parameters: {
                type: 'object',
                properties: {
                    note_id: { type: 'string', description: 'The note ID' },
                    search: { type: 'string', description: 'Keywords to locate note if ID unknown' },
                    content: { type: 'string', description: 'New full note content' },
                    append_content: { type: 'string', description: 'Text or bullet points to append to the existing note' },
                    tags: { type: 'array', items: { type: 'string' }, description: 'Updated list of tags' },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'delete_note',
            description: 'Delete or move a note to the Trash.',
            parameters: {
                type: 'object',
                properties: {
                    note_id: { type: 'string', description: 'The note ID' },
                    search: { type: 'string', description: 'Keywords to locate note' },
                },
            },
        },
    },

    // --- Habits ---
    {
        type: 'function',
        function: {
            name: 'list_habits',
            description: 'List all habits and their current streaks.',
            parameters: { type: 'object', properties: {} },
        },
    },
    {
        type: 'function',
        function: {
            name: 'create_habit',
            description: 'Create a new daily or weekly habit with target frequency.',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string', description: 'Habit name (e.g. "Morning Run", "Read 30 mins")' },
                    target_per_week: { type: 'number', description: 'Target times per week (1-7, default 7)' },
                },
                required: ['title'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'update_habit',
            description: 'Rename habit or change target weekly goals.',
            parameters: {
                type: 'object',
                properties: {
                    habit_id: { type: 'string', description: 'The habit ID' },
                    name: { type: 'string', description: 'Habit title to locate habit' },
                    title: { type: 'string', description: 'New habit title' },
                    target_per_week: { type: 'number', description: 'New target times per week (1-7)' },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'log_habit',
            description: 'Check in a habit for today (or specified date) to maintain the streak.',
            parameters: {
                type: 'object',
                properties: {
                    habit_id: { type: 'string', description: 'The ID of the habit' },
                    name: { type: 'string', description: 'Habit name keywords' },
                    date: { type: 'string', description: 'Optional date YYYY-MM-DD (defaults to today)' },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'unlog_habit',
            description: 'Undo/remove a habit check-in for a specific date.',
            parameters: {
                type: 'object',
                properties: {
                    habit_id: { type: 'string', description: 'The ID of the habit' },
                    name: { type: 'string', description: 'Habit name keywords' },
                    date: { type: 'string', description: 'Optional date YYYY-MM-DD (defaults to today)' },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'delete_habit',
            description: 'Delete or archive an inactive habit.',
            parameters: {
                type: 'object',
                properties: {
                    habit_id: { type: 'string', description: 'The habit ID' },
                    name: { type: 'string', description: 'Habit title keywords' },
                },
            },
        },
    },

    // --- Calendar Events ---
    {
        type: 'function',
        function: {
            name: 'list_calendar_events',
            description: 'Retrieve calendar events within a date range or search keyword.',
            parameters: {
                type: 'object',
                properties: {
                    start: { type: 'string', description: 'Start date YYYY-MM-DD' },
                    end: { type: 'string', description: 'End date YYYY-MM-DD' },
                    search: { type: 'string', description: 'Keyword to filter event title' },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'create_calendar_event',
            description: 'Schedule a calendar event with start/end time and location.',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string', description: 'Event title' },
                    starts_at: { type: 'string', description: 'Start date and time (ISO format)' },
                    ends_at: { type: 'string', description: 'End date and time (ISO format)' },
                    location: { type: 'string', description: 'Meeting link or room location' },
                },
                required: ['title', 'starts_at'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'update_calendar_event',
            description: 'Reschedule start/end dates, update title or location of an event.',
            parameters: {
                type: 'object',
                properties: {
                    event_id: { type: 'string', description: 'The event ID' },
                    name: { type: 'string', description: 'Event title to locate the event' },
                    title: { type: 'string', description: 'Updated title' },
                    starts_at: { type: 'string', description: 'Updated start time' },
                    ends_at: { type: 'string', description: 'Updated end time' },
                    location: { type: 'string', description: 'Updated location' },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'delete_calendar_event',
            description: 'Cancel or delete an event from the calendar.',
            parameters: {
                type: 'object',
                properties: {
                    event_id: { type: 'string', description: 'The event ID' },
                    name: { type: 'string', description: 'Event title keywords' },
                },
            },
        },
    },

    // --- Reminders ---
    {
        type: 'function',
        function: {
            name: 'list_reminders',
            description: 'Retrieve pending or all reminders.',
            parameters: {
                type: 'object',
                properties: {
                    is_done: { type: 'boolean', description: 'Filter by completed status (default false for pending only)' },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'create_reminder',
            description: 'Create a timed reminder notification.',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string', description: 'Reminder message' },
                    remind_at: { type: 'string', description: 'Date & time when the reminder should trigger (ISO format)' },
                },
                required: ['title', 'remind_at'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'update_reminder',
            description: 'Reschedule reminder time or edit message.',
            parameters: {
                type: 'object',
                properties: {
                    reminder_id: { type: 'string', description: 'The reminder ID' },
                    name: { type: 'string', description: 'Reminder text keywords' },
                    title: { type: 'string', description: 'Updated reminder message' },
                    remind_at: { type: 'string', description: 'Updated trigger time' },
                    is_done: { type: 'boolean', description: 'Mark done or active' },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'snooze_reminder',
            description: 'Snooze a reminder by a specific duration in minutes.',
            parameters: {
                type: 'object',
                properties: {
                    reminder_id: { type: 'string', description: 'The reminder ID' },
                    name: { type: 'string', description: 'Reminder keywords' },
                    minutes: { type: 'number', description: 'Minutes to snooze (default 15)' },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'complete_reminder',
            description: 'Mark a reminder as completed / dismissed.',
            parameters: {
                type: 'object',
                properties: {
                    reminder_id: { type: 'string', description: 'The reminder ID' },
                    name: { type: 'string', description: 'Reminder keywords' },
                },
            },
        },
    },
];

/**
 * Executes a tool function on behalf of the AI assistant
 */
async function executeToolCall(profileId, name, args = {}) {
    try {
        switch (name) {
            // ==================== TASKS ====================
            case 'create_task': {
                const title = args.title || args.name || 'New Task';
                const dueAt = args.due_at || args.due_date || args.dueDate || null;
                const task = await taskService.createTask(profileId, {
                    title,
                    description: args.description || args.desc || '',
                    urgent: args.urgent ? 1 : 0,
                    important: args.important ? 1 : 0,
                    due_at: dueAt,
                });
                return { success: true, message: `Task "${task.title}" created successfully!`, task };
            }

            case 'list_tasks': {
                const tasks = await taskService.listTasks(profileId);
                const status = (args.status || '').toLowerCase();
                let filtered = status && status !== 'all'
                    ? tasks.filter(t => t.status === status)
                    : tasks;
                if (args.search) {
                    const q = args.search.toLowerCase();
                    filtered = filtered.filter(t =>
                        (t.title || '').toLowerCase().includes(q) ||
                        (t.description || '').toLowerCase().includes(q)
                    );
                }
                return { success: true, count: filtered.length, tasks: filtered.slice(0, 15) };
            }

            case 'update_task':
            case 'update_task_status': {
                let taskId = args.task_id || args.id || args.taskId;
                const allTasks = await taskService.listTasks(profileId);

                // Smart resolution by name / title keywords if taskId not found
                if (!taskId || !allTasks.some(t => t.id === taskId)) {
                    const searchKey = (args.name || args.title || '').toLowerCase();
                    if (searchKey) {
                        const match = allTasks.find(t => t.title.toLowerCase().includes(searchKey));
                        if (match) taskId = match.id;
                    }
                }

                if (!taskId) {
                    return { error: `Could not find matching task to update.` };
                }

                const currentTask = allTasks.find(t => t.id === taskId);
                const updatePayload = {};
                if (args.title !== undefined) updatePayload.title = args.title;
                if (args.description !== undefined) updatePayload.description = args.description;
                if (args.urgent !== undefined) updatePayload.urgent = args.urgent ? 1 : 0;
                if (args.important !== undefined) updatePayload.important = args.important ? 1 : 0;
                if (args.due_at !== undefined) updatePayload.due_at = args.due_at;
                if (args.status !== undefined) updatePayload.status = args.status;

                const task = await taskService.updateTask(profileId, taskId, updatePayload);
                return { success: true, message: `Task "${task?.title || currentTask?.title || taskId}" updated successfully!`, task };
            }

            case 'delete_task': {
                let taskId = args.task_id || args.id || args.taskId;
                const allTasks = await taskService.listTasks(profileId);

                if (!taskId || !allTasks.some(t => t.id === taskId)) {
                    const searchKey = (args.name || '').toLowerCase();
                    if (searchKey) {
                        const match = allTasks.find(t => t.title.toLowerCase().includes(searchKey));
                        if (match) taskId = match.id;
                    }
                }

                if (!taskId) return { error: `Could not find task to delete.` };
                const currentTask = allTasks.find(t => t.id === taskId);
                await taskService.softDeleteTask(profileId, taskId);
                return { success: true, message: `Task "${currentTask?.title || taskId}" moved to Trash.`, id: taskId };
            }

            // ==================== NOTES ====================
            case 'create_note': {
                const content = args.content || args.text || args.note || '';
                const note = await noteService.createNote(profileId, {
                    content,
                    tags: Array.isArray(args.tags) ? args.tags : (args.tags ? [String(args.tags)] : []),
                });
                return { success: true, message: 'Note saved successfully!', note };
            }

            case 'list_notes': {
                const notes = await noteService.listNotes(profileId);
                const search = (args.search || '').toLowerCase();
                const filtered = search
                    ? notes.filter(n => (n.content || '').toLowerCase().includes(search))
                    : notes;
                return { success: true, count: filtered.length, notes: filtered.slice(0, 10) };
            }

            case 'update_note': {
                let noteId = args.note_id || args.id || args.noteId;
                const allNotes = await noteService.listNotes(profileId);

                if (!noteId || !allNotes.some(n => n.id === noteId)) {
                    const searchKey = (args.search || '').toLowerCase();
                    if (searchKey) {
                        const match = allNotes.find(n => (n.content || '').toLowerCase().includes(searchKey));
                        if (match) noteId = match.id;
                    }
                }

                if (!noteId) return { error: 'Could not find matching note to update.' };
                const currentNote = allNotes.find(n => n.id === noteId);

                let updatedContent = args.content;
                if (args.append_content && currentNote) {
                    updatedContent = `${currentNote.content || ''}\n\n${args.append_content}`;
                }

                const updatePayload = {};
                if (updatedContent !== undefined) updatePayload.content = updatedContent;
                if (args.tags !== undefined) updatePayload.tags = Array.isArray(args.tags) ? args.tags : [String(args.tags)];

                const note = await noteService.updateNote(profileId, noteId, updatePayload);
                return { success: true, message: 'Note updated successfully!', note };
            }

            case 'delete_note': {
                let noteId = args.note_id || args.id || args.noteId;
                const allNotes = await noteService.listNotes(profileId);

                if (!noteId || !allNotes.some(n => n.id === noteId)) {
                    const searchKey = (args.search || '').toLowerCase();
                    if (searchKey) {
                        const match = allNotes.find(n => (n.content || '').toLowerCase().includes(searchKey));
                        if (match) noteId = match.id;
                    }
                }

                if (!noteId) return { error: 'Could not find note to delete.' };
                await noteService.softDeleteNote(profileId, noteId);
                return { success: true, message: 'Note moved to Trash.', id: noteId };
            }

            // ==================== HABITS ====================
            case 'list_habits': {
                const habits = await habitService.listHabits(profileId);
                return { success: true, habits };
            }

            case 'create_habit': {
                const title = args.title || args.name || 'New Habit';
                const target = args.target_per_week ? Number(args.target_per_week) : 7;
                const habit = await habitService.createHabit(profileId, { title, target_per_week: target });
                return { success: true, message: `Habit "${habit.title}" created (Target: ${habit.target_per_week}x/week)! 🔥`, habit };
            }

            case 'update_habit': {
                let habitId = args.habit_id || args.id || args.habitId;
                const allHabits = await habitService.listHabits(profileId);

                if (!habitId || !allHabits.some(h => h.id === habitId)) {
                    const searchKey = (args.name || args.title || '').toLowerCase();
                    if (searchKey) {
                        const match = allHabits.find(h => h.title.toLowerCase().includes(searchKey));
                        if (match) habitId = match.id;
                    }
                }

                if (!habitId) return { error: 'Could not find habit to update.' };
                const currentHabit = allHabits.find(h => h.id === habitId);
                const updatePayload = {};
                if (args.title) updatePayload.title = args.title;
                if (args.target_per_week) updatePayload.target_per_week = Number(args.target_per_week);

                const habit = await habitService.updateHabit(profileId, habitId, updatePayload);
                return { success: true, message: `Habit "${habit?.title || currentHabit?.title}" updated!`, habit };
            }

            case 'log_habit': {
                let habitId = args.habit_id || args.id || args.habitId;
                const habitName = args.name || args.habit_name || args.title;
                const habits = await habitService.listHabits(profileId);

                if (!habitId && habitName) {
                    const match = habits.find(h => h.title.toLowerCase().includes(habitName.toLowerCase()));
                    if (match) habitId = match.id;
                } else if (habitId && !habits.some(h => h.id === habitId) && habitName) {
                    const match = habits.find(h => h.title.toLowerCase().includes(habitName.toLowerCase()));
                    if (match) habitId = match.id;
                }

                if (!habitId && habits.length > 0) {
                    habitId = habits[0].id;
                }

                if (!habitId) return { error: 'No active habits found to check in. Please create a habit first!' };

                const targetHabit = habits.find(h => h.id === habitId) || habits[0];
                const todayStr = args.date || new Date().toISOString().slice(0, 10);
                try {
                    await habitLogService.createLog(habitId, profileId, todayStr);
                } catch (e) {
                    // Ignore duplicate
                }
                return { success: true, message: `Habit "${targetHabit.title}" checked in for ${todayStr}! 🔥`, habit_id: habitId, title: targetHabit.title };
            }

            case 'unlog_habit': {
                let habitId = args.habit_id || args.id || args.habitId;
                const habitName = args.name || args.habit_name || args.title;
                const habits = await habitService.listHabits(profileId);

                if (!habitId && habitName) {
                    const match = habits.find(h => h.title.toLowerCase().includes(habitName.toLowerCase()));
                    if (match) habitId = match.id;
                }

                if (!habitId) return { error: 'Habit not found.' };
                const todayStr = args.date || new Date().toISOString().slice(0, 10);
                await habitLogService.deleteLog(habitId, profileId, todayStr);
                return { success: true, message: `Removed check-in for habit on ${todayStr}.` };
            }

            case 'delete_habit': {
                let habitId = args.habit_id || args.id || args.habitId;
                const allHabits = await habitService.listHabits(profileId);

                if (!habitId || !allHabits.some(h => h.id === habitId)) {
                    const searchKey = (args.name || '').toLowerCase();
                    if (searchKey) {
                        const match = allHabits.find(h => h.title.toLowerCase().includes(searchKey));
                        if (match) habitId = match.id;
                    }
                }

                if (!habitId) return { error: 'Habit not found.' };
                const currentHabit = allHabits.find(h => h.id === habitId);
                await habitService.softDeleteHabit(profileId, habitId);
                return { success: true, message: `Habit "${currentHabit?.title || habitId}" deleted.`, id: habitId };
            }

            // ==================== CALENDAR ====================
            case 'list_calendar_events': {
                const events = await calendarEventService.listCalendarEvents(profileId, {
                    start: args.start,
                    end: args.end,
                });
                let filtered = events;
                if (args.search) {
                    const q = args.search.toLowerCase();
                    filtered = filtered.filter(e => (e.title || '').toLowerCase().includes(q));
                }
                return { success: true, count: filtered.length, events: filtered.slice(0, 15) };
            }

            case 'create_calendar_event': {
                const title = args.title || args.name || 'New Event';
                const startsAt = args.starts_at || args.start || args.startTime || new Date().toISOString();
                const endsAt = args.ends_at || args.end || args.endTime || null;
                const event = await calendarEventService.createCalendarEvent(profileId, {
                    title,
                    starts_at: startsAt,
                    ends_at: endsAt,
                    location: args.location || null,
                });
                return { success: true, message: `Event "${event.title}" scheduled!`, event };
            }

            case 'update_calendar_event': {
                let eventId = args.event_id || args.id || args.eventId;
                const allEvents = await calendarEventService.listCalendarEvents(profileId);

                if (!eventId || !allEvents.some(e => e.id === eventId)) {
                    const searchKey = (args.name || args.title || '').toLowerCase();
                    if (searchKey) {
                        const match = allEvents.find(e => e.title.toLowerCase().includes(searchKey));
                        if (match) eventId = match.id;
                    }
                }

                if (!eventId) return { error: 'Could not find event to update.' };
                const currentEvent = allEvents.find(e => e.id === eventId);
                const updatePayload = {};
                if (args.title) updatePayload.title = args.title;
                if (args.starts_at) updatePayload.starts_at = args.starts_at;
                if (args.ends_at) updatePayload.ends_at = args.ends_at;
                if (args.location !== undefined) updatePayload.location = args.location;

                const event = await calendarEventService.updateCalendarEvent(profileId, eventId, updatePayload);
                return { success: true, message: `Event "${event?.title || currentEvent?.title}" updated!`, event };
            }

            case 'delete_calendar_event': {
                let eventId = args.event_id || args.id || args.eventId;
                const allEvents = await calendarEventService.listCalendarEvents(profileId);

                if (!eventId || !allEvents.some(e => e.id === eventId)) {
                    const searchKey = (args.name || '').toLowerCase();
                    if (searchKey) {
                        const match = allEvents.find(e => e.title.toLowerCase().includes(searchKey));
                        if (match) eventId = match.id;
                    }
                }

                if (!eventId) return { error: 'Event not found to delete.' };
                const currentEvent = allEvents.find(e => e.id === eventId);
                await calendarEventService.softDeleteCalendarEvent(profileId, eventId);
                return { success: true, message: `Event "${currentEvent?.title || eventId}" deleted.`, id: eventId };
            }

            // ==================== REMINDERS ====================
            case 'list_reminders': {
                const reminders = await reminderService.listReminders(profileId, {
                    isDone: args.is_done !== undefined ? args.is_done : false,
                });
                return { success: true, count: reminders.length, reminders: reminders.slice(0, 15) };
            }

            case 'create_reminder': {
                const title = args.title || args.message || 'Reminder';
                const remindAt = args.remind_at || args.time || args.remindAt || new Date().toISOString();
                const reminder = await reminderService.createReminder(profileId, {
                    title,
                    remind_at: remindAt,
                });
                return { success: true, message: `Reminder set for ${reminder.remind_at}`, reminder };
            }

            case 'update_reminder': {
                let reminderId = args.reminder_id || args.id || args.reminderId;
                const allReminders = await reminderService.listReminders(profileId);

                if (!reminderId || !allReminders.some(r => r.id === reminderId)) {
                    const searchKey = (args.name || args.title || '').toLowerCase();
                    if (searchKey) {
                        const match = allReminders.find(r => r.title.toLowerCase().includes(searchKey));
                        if (match) reminderId = match.id;
                    }
                }

                if (!reminderId) return { error: 'Reminder not found.' };
                const updatePayload = {};
                if (args.title) updatePayload.title = args.title;
                if (args.remind_at) updatePayload.remind_at = args.remind_at;
                if (args.is_done !== undefined) updatePayload.is_done = args.is_done;

                const reminder = await reminderService.updateReminder(profileId, reminderId, updatePayload);
                return { success: true, message: `Reminder "${reminder?.title}" updated!`, reminder };
            }

            case 'snooze_reminder': {
                let reminderId = args.reminder_id || args.id || args.reminderId;
                const allReminders = await reminderService.listReminders(profileId);

                if (!reminderId || !allReminders.some(r => r.id === reminderId)) {
                    const searchKey = (args.name || '').toLowerCase();
                    if (searchKey) {
                        const match = allReminders.find(r => r.title.toLowerCase().includes(searchKey));
                        if (match) reminderId = match.id;
                    }
                }

                if (!reminderId) return { error: 'Reminder not found.' };
                const currentReminder = allReminders.find(r => r.id === reminderId);
                const minutes = Number(args.minutes || 15);
                const baseTime = currentReminder?.remind_at ? new Date(currentReminder.remind_at) : new Date();
                const newTime = new Date(baseTime.getTime() + minutes * 60 * 1000).toISOString();

                const reminder = await reminderService.updateReminder(profileId, reminderId, { remind_at: newTime });
                return { success: true, message: `Reminder snoozed by ${minutes}m to ${newTime}! ⏰`, reminder };
            }

            case 'complete_reminder': {
                let reminderId = args.reminder_id || args.id || args.reminderId;
                const allReminders = await reminderService.listReminders(profileId);

                if (!reminderId || !allReminders.some(r => r.id === reminderId)) {
                    const searchKey = (args.name || '').toLowerCase();
                    if (searchKey) {
                        const match = allReminders.find(r => r.title.toLowerCase().includes(searchKey));
                        if (match) reminderId = match.id;
                    }
                }

                if (!reminderId) return { error: 'Reminder not found.' };
                const reminder = await reminderService.updateReminder(profileId, reminderId, { is_done: true });
                return { success: true, message: `Reminder "${reminder?.title || reminderId}" marked as done! ✅` };
            }

            default:
                return { error: `Unknown tool: ${name}` };
        }
    } catch (err) {
        return { error: err.message || 'Failed to execute action' };
    }
}

/**
 * Normalizes custom/preset endpoint URL for models listing.
 */
function normalizeModelsUrl(url, providerKey) {
    let clean = (url || '').trim().replace(/\/+$/, '');
    if (!clean) {
        if (providerKey === 'ollama_cloud') return 'https://ollama.com/v1/models';
        if (providerKey === 'gemini') return 'https://generativelanguage.googleapis.com/v1beta/openai/models';
        if (providerKey === 'custom') return 'http://localhost:11434/v1/models';
        return 'https://api.openai.com/v1/models';
    }

    if (clean.endsWith('/chat/completions')) {
        return clean.replace(/\/chat\/completions$/, '/models');
    }
    if (clean.endsWith('/models')) return clean;
    if (clean.endsWith('/v1')) return `${clean}/models`;
    return `${clean}/models`;
}

/**
 * Normalizes custom/preset endpoint URL for chat completions.
 */
function normalizeEndpointUrl(url, providerKey) {
    let clean = (url || '').trim().replace(/\/+$/, '');
    if (!clean) {
        if (providerKey === 'ollama_cloud') return 'https://ollama.com/v1/chat/completions';
        if (providerKey === 'gemini') return 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
        if (providerKey === 'custom') return 'http://localhost:11434/v1/chat/completions';
        return 'https://api.openai.com/v1/chat/completions';
    }

    if (clean.endsWith('/chat/completions')) return clean;
    if (clean.endsWith('/v1')) return `${clean}/chat/completions`;
    return `${clean}/chat/completions`;
}

/**
 * Fetches live models directly from provider endpoint with robust fallbacks
 */
async function fetchModels(providerConfig) {
    const config = providerConfig || {};
    const providerKey = config.providerKey || config.provider || 'gemini';
    const rawEndpoint = config.endpointUrl || DEFAULT_ENDPOINTS[providerKey];
    const apiKey = (config.apiKey || '').trim();

    // If provider is gemini and we have an API key, we can query Google's models endpoint directly
    if (providerKey === 'gemini') {
        const geminiUrls = [
            apiKey ? `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}` : null,
            'https://generativelanguage.googleapis.com/v1beta/openai/models',
        ].filter(Boolean);

        for (const targetUrl of geminiUrls) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);
                const headers = { 'Content-Type': 'application/json' };
                if (apiKey && !targetUrl.includes('key=')) {
                    headers['Authorization'] = `Bearer ${apiKey}`;
                }

                const response = await fetch(targetUrl, {
                    method: 'GET',
                    headers,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    let list = [];

                    if (Array.isArray(data.models)) {
                        list = data.models
                            .filter(m => {
                                const methods = m.supportedGenerationMethods || [];
                                const name = (m.name || '').toLowerCase();
                                return (methods.includes('generateContent') || name.includes('gemini')) &&
                                       !name.includes('embedding') &&
                                       !name.includes('aqa') &&
                                       !name.includes('imagen');
                            })
                            .map(m => {
                                const id = (m.name || '').replace(/^models\//, '');
                                return {
                                    id,
                                    name: m.displayName || id,
                                };
                            });
                    } else if (Array.isArray(data.data)) {
                        list = data.data
                            .filter(item => {
                                const id = (item.id || '').toLowerCase();
                                return id.includes('gemini') && !id.includes('embedding');
                            })
                            .map(item => ({
                                id: item.id,
                                name: item.display_name || item.id,
                            }));
                    }

                    if (list.length > 0) {
                        return { ok: true, models: list, source: targetUrl };
                    }
                }
            } catch (e) {
                // continue to next URL or fallback
            }
        }

        // If live fetch not available (e.g. no key or offline), return curated presets
        return { ok: true, models: PRESET_MODELS.gemini, source: 'curated-defaults' };
    }

    // If provider is OpenAI
    if (providerKey === 'openai') {
        if (!apiKey) {
            return { ok: true, models: PRESET_MODELS.openai, source: 'curated-defaults' };
        }

        const targetUrl = normalizeModelsUrl(rawEndpoint, providerKey);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const response = await fetch(targetUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data.data)) {
                    // Filter for chat-capable models
                    let list = data.data
                        .filter(item => {
                            const id = (item.id || '').toLowerCase();
                            return (
                                (id.startsWith('gpt-') || id.startsWith('o1') || id.startsWith('o3') || id.startsWith('chatgpt')) &&
                                !id.includes('whisper') &&
                                !id.includes('dall-e') &&
                                !id.includes('tts') &&
                                !id.includes('embed') &&
                                !id.includes('moderation') &&
                                !id.includes('realtime') &&
                                !id.includes('audio')
                            );
                        })
                        .map(item => ({
                            id: item.id,
                            name: item.id,
                        }));

                    // Priority sorting: flagships first
                    const priorityOrder = ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'o1', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
                    list.sort((a, b) => {
                        const aIndex = priorityOrder.indexOf(a.id);
                        const bIndex = priorityOrder.indexOf(b.id);
                        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                        if (aIndex !== -1) return -1;
                        if (bIndex !== -1) return 1;
                        return a.id.localeCompare(b.id);
                    });

                    if (list.length > 0) {
                        return { ok: true, models: list, source: targetUrl };
                    }
                }
            }
        } catch (e) {
            // fallback to presets
        }

        return { ok: true, models: PRESET_MODELS.openai, source: 'curated-defaults' };
    }

    // Generic / Ollama Cloud / Custom endpoints
    const targetUrl = normalizeModelsUrl(rawEndpoint, providerKey);
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers,
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch models (${response.status}): ${errorText.slice(0, 150)}`);
        }

        const data = await response.json();
        let list = [];

        if (Array.isArray(data.data)) {
            list = data.data.map(item => ({
                id: item.id,
                name: item.display_name || item.id,
            }));
        } else if (Array.isArray(data.models)) {
            list = data.models.map(item => {
                const id = (item.id || item.name || '').replace(/^models\//, '');
                return {
                    id,
                    name: item.displayName || item.display_name || id,
                };
            });
        }

        // Filter out non-chat models
        list = list.filter(m => {
            const id = (m.id || '').toLowerCase();
            return !id.includes('whisper') &&
                   !id.includes('embed') &&
                   !id.includes('dall-e') &&
                   !id.includes('tts') &&
                   !id.includes('moderation');
        });

        if (list.length === 0 && PRESET_MODELS[providerKey] && PRESET_MODELS[providerKey].length > 0) {
            return { ok: true, models: PRESET_MODELS[providerKey], source: 'fallback' };
        }

        return { ok: true, models: list, source: targetUrl };
    } catch (err) {
        clearTimeout(timeoutId);
        if (PRESET_MODELS[providerKey] && PRESET_MODELS[providerKey].length > 0) {
            return { ok: true, models: PRESET_MODELS[providerKey], source: 'preset-fallback', warning: err.message };
        }
        throw err;
    }
}

/**
 * Enriches pending approval items with live workspace entity metadata (Task title, habit goal, note content, etc.)
 */
async function enrichPendingApprovalItem(profileId, item) {
    const validProfileId = resolveProfileId(profileId);
    const { tool, args = {} } = item;
    const enriched = { ...item };

    try {
        if (tool.includes('task')) {
            const allTasks = await taskService.listTasks(validProfileId).catch(() => []);
            let taskId = args.task_id || args.id || args.taskId;
            if (!taskId && (args.name || args.title)) {
                const searchKey = (args.name || args.title || '').toLowerCase();
                const match = allTasks.find(t => t.title.toLowerCase().includes(searchKey));
                if (match) taskId = match.id;
            }
            if (taskId) {
                const found = allTasks.find(t => t.id === taskId);
                if (found) {
                    enriched.target_title = found.title;
                    enriched.target_id = found.id;
                    enriched.current_status = found.status;
                    enriched.current_due_at = found.due_at;
                    enriched.current_urgent = found.urgent;
                    enriched.current_important = found.important;
                    enriched.current_description = found.description;
                }
            }
        } else if (tool.includes('note')) {
            const allNotes = await noteService.listNotes(validProfileId).catch(() => []);
            let noteId = args.note_id || args.id || args.noteId;
            if (!noteId && (args.search || args.content)) {
                const searchKey = (args.search || args.content || '').toLowerCase();
                const match = allNotes.find(n => (n.content || '').toLowerCase().includes(searchKey));
                if (match) noteId = match.id;
            }
            if (noteId) {
                const found = allNotes.find(n => n.id === noteId);
                if (found) {
                    const firstLine = (found.content || '').split('\n')[0].trim().slice(0, 60);
                    enriched.target_title = firstLine || 'Note #' + found.id.slice(0, 8);
                    enriched.target_id = found.id;
                    enriched.current_content = found.content;
                }
            }
        } else if (tool.includes('habit')) {
            const allHabits = await habitService.listHabits(validProfileId).catch(() => []);
            let habitId = args.habit_id || args.id || args.habitId;
            if (!habitId && (args.name || args.title)) {
                const searchKey = (args.name || args.title || '').toLowerCase();
                const match = allHabits.find(h => h.title.toLowerCase().includes(searchKey));
                if (match) habitId = match.id;
            }
            if (habitId) {
                const found = allHabits.find(h => h.id === habitId);
                if (found) {
                    enriched.target_title = found.title;
                    enriched.target_id = found.id;
                    enriched.current_target_per_week = found.target_per_week;
                }
            }
        } else if (tool.includes('calendar') || tool.includes('event')) {
            const allEvents = await calendarEventService.listCalendarEvents(validProfileId).catch(() => []);
            let eventId = args.event_id || args.id || args.eventId;
            if (!eventId && (args.name || args.title)) {
                const searchKey = (args.name || args.title || '').toLowerCase();
                const match = allEvents.find(e => e.title.toLowerCase().includes(searchKey));
                if (match) eventId = match.id;
            }
            if (eventId) {
                const found = allEvents.find(e => e.id === eventId);
                if (found) {
                    enriched.target_title = found.title;
                    enriched.target_id = found.id;
                    enriched.current_starts_at = found.starts_at;
                    enriched.current_ends_at = found.ends_at;
                    enriched.current_location = found.location;
                }
            }
        } else if (tool.includes('reminder')) {
            const allReminders = await reminderService.listReminders(validProfileId).catch(() => []);
            let reminderId = args.reminder_id || args.id || args.reminderId;
            if (!reminderId && (args.name || args.title)) {
                const searchKey = (args.name || args.title || '').toLowerCase();
                const match = allReminders.find(r => r.title.toLowerCase().includes(searchKey));
                if (match) reminderId = match.id;
            }
            if (reminderId) {
                const found = allReminders.find(r => r.id === reminderId);
                if (found) {
                    enriched.target_title = found.title;
                    enriched.target_id = found.id;
                    enriched.current_remind_at = found.remind_at;
                    enriched.current_is_done = found.is_done;
                }
            }
        }
    } catch (e) {
        // fail gracefully
    }

    return enriched;
}

/**
 * Sends chat completion with full tool calling capabilities
 */
async function sendChatCompletion({ profileId, messages, providerConfig, allowTools = true, approvalMode = false }) {
    const config = providerConfig || {};
    const providerKey = config.providerKey || config.provider || 'gemini';
    const rawEndpoint = config.endpointUrl || DEFAULT_ENDPOINTS[providerKey];
    const targetUrl = normalizeEndpointUrl(rawEndpoint, providerKey);
    const model = (config.modelName || config.model || '').trim() || (PRESET_MODELS[providerKey]?.[0]?.id || 'gemini-2.0-flash');
    const apiKey = (config.apiKey || '').trim();

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const profileContext = await buildProfileContext(profileId);
    const systemPrompt = `You are Second Brain AI, an intelligent personal productivity assistant integrated directly into the user's Second Brain application.
You have direct tool access to view, create, edit, update, delete, and manage the user's Tasks, Notes, Habits, Calendar Events, and Reminders.

When the user asks you to create, edit, update, delete, complete, or list something, ALWAYS invoke your available tools!
Provide clear, helpful markdown with bullet points and friendly confirmations.

Current User Context:
${profileContext}`;

    const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...(messages || []).map(m => ({
            role: m.role,
            content: m.content || '',
            ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
            ...(m.tool_calls ? { tool_calls: typeof m.tool_calls === 'string' ? JSON.parse(m.tool_calls) : m.tool_calls } : {}),
        }))
    ];

    let currentMessages = [...formattedMessages];
    const toolExecutions = [];
    const maxTurns = 5;

    for (let turn = 0; turn < maxTurns; turn++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);

        try {
            const requestBody = {
                model,
                messages: currentMessages,
                temperature: 0.7,
                ...(allowTools ? { tools: AI_TOOLS, tool_choice: 'auto' } : {})
            };

            const response = await fetch(targetUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errText = await response.text();
                let errMsg = `Provider error (${response.status}): ${response.statusText}`;
                try {
                    const parsed = JSON.parse(errText);
                    if (parsed.error?.message) errMsg = parsed.error.message;
                } catch {
                    if (errText) errMsg += ` — ${errText.slice(0, 150)}`;
                }
                throw new Error(errMsg);
            }

            const data = await response.json();
            const choice = data.choices && data.choices[0];
            const message = choice?.message || {};

            // If no tool calls, return final message and any accumulated tool executions
            if (!message.tool_calls || message.tool_calls.length === 0) {
                return {
                    reply: message.content || (toolExecutions.length > 0 ? 'Actions processed successfully.' : 'I processed your request.'),
                    model: data.model || model,
                    tool_executions: toolExecutions.length > 0 ? toolExecutions : undefined
                };
            }

            // Check if modifying tools are called
            const isReadOnly = (name) => name.startsWith('list_') || name.startsWith('get_');
            const hasModifyingTools = message.tool_calls.some(tc => !isReadOnly(tc.function?.name || ''));

            // If approvalMode is active and modifying actions are requested, stop and return pending approvals
            if (approvalMode && hasModifyingTools) {
                const rawApprovals = message.tool_calls
                    .filter(tc => !isReadOnly(tc.function?.name || ''))
                    .map(tc => {
                        let fnArgs = {};
                        try {
                            fnArgs = typeof tc.function?.arguments === 'string' ? JSON.parse(tc.function.arguments) : (tc.function?.arguments || {});
                        } catch {
                            fnArgs = {};
                        }
                        return {
                            id: tc.id || uuidv4(),
                            tool: tc.function?.name,
                            args: fnArgs,
                            status: 'pending'
                        };
                    });

                // Enrich with actual entity metadata (e.g. real task titles instead of raw IDs)
                const pendingApprovals = await Promise.all(
                    rawApprovals.map(item => enrichPendingApprovalItem(profileId, item))
                );

                return {
                    reply: message.content || 'I have prepared the following actions for your approval. Please confirm to execute:',
                    model: data.model || model,
                    pending_approvals: pendingApprovals,
                    tool_executions: toolExecutions.length > 0 ? toolExecutions : undefined,
                    tool_calls: []
                };
            }

            // Otherwise execute read-only tools (or all tools if auto-approve is on)
            currentMessages.push(message);

            for (const toolCall of message.tool_calls) {
                const fnName = toolCall.function?.name;
                let fnArgs = {};
                try {
                    fnArgs = typeof toolCall.function?.arguments === 'string' ? JSON.parse(toolCall.function.arguments) : (toolCall.function?.arguments || {});
                } catch {
                    fnArgs = {};
                }

                const result = await executeToolCall(profileId, fnName, fnArgs);
                toolExecutions.push({ tool: fnName, args: fnArgs, result });

                currentMessages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(result)
                });
            }
        } catch (err) {
            clearTimeout(timeoutId);
            throw err;
        }
    }

    return {
        reply: toolExecutions.length > 0 ? 'Actions processed successfully.' : 'Request completed.',
        model,
        tool_executions: toolExecutions
    };
}

/**
 * Quick ping test for custom endpoint & auth verification.
 */
async function testConnection(providerConfig) {
    const config = providerConfig || {};
    const providerKey = config.providerKey || config.provider || 'gemini';
    const rawEndpoint = config.endpointUrl || DEFAULT_ENDPOINTS[providerKey];
    const targetUrl = normalizeEndpointUrl(rawEndpoint, providerKey);
    const model = (config.modelName || config.model || '').trim() || (PRESET_MODELS[providerKey]?.[0]?.id || 'gemini-2.0-flash');
    const apiKey = (config.apiKey || '').trim();

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
        const body = {
            model,
            messages: [{ role: 'user', content: 'Ping. Reply with pong.' }],
            max_tokens: 10
        };

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errText = await response.text();
            let msg = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const parsed = JSON.parse(errText);
                if (parsed.error?.message) msg = parsed.error.message;
            } catch {
                if (errText) msg += ` (${errText.slice(0, 150)})`;
            }
            return { ok: false, error: msg };
        }

        const data = await response.json();
        return { ok: true, message: `Connected successfully to model "${data.model || model}"` };
    } catch (err) {
        clearTimeout(timeoutId);
        return { ok: false, error: err.message };
    }
}

// -------------------------------------------------------------
// AI Chat Sessions & Messages DB Management
// -------------------------------------------------------------

function resolveProfileId(profileId) {
    if (profileId) {
        const row = db.prepare('SELECT id FROM profiles WHERE id = ?').get(profileId);
        if (row) return row.id;
    }
    const fallback = db.prepare('SELECT id FROM profiles LIMIT 1').get();
    return fallback ? fallback.id : profileId;
}

async function listSessions(profileId) {
    const validProfileId = resolveProfileId(profileId);
    if (!validProfileId) return [];

    // Clean up empty duplicate sessions (older than latest with 0 messages)
    try {
        db.prepare(`
            DELETE FROM ai_sessions
            WHERE profile_id = ?
            AND id NOT IN (SELECT DISTINCT session_id FROM ai_messages)
            AND id NOT IN (
                SELECT id FROM ai_sessions
                WHERE profile_id = ?
                ORDER BY updated_at DESC
                LIMIT 1
            )
        `).run(validProfileId, validProfileId);
    } catch (e) {
        // ignore
    }

    const stmt = db.prepare(`
        SELECT s.*, (SELECT COUNT(*) FROM ai_messages m WHERE m.session_id = s.id) as message_count
        FROM ai_sessions s
        WHERE s.profile_id = ?
        ORDER BY s.updated_at DESC
    `);
    return stmt.all(validProfileId);
}

async function getSession(profileId, sessionId) {
    const validProfileId = resolveProfileId(profileId);
    if (!validProfileId || !sessionId) return null;
    const stmt = db.prepare(`
        SELECT * FROM ai_sessions
        WHERE profile_id = ? AND id = ?
    `);
    return stmt.get(validProfileId, sessionId) || null;
}

async function createSession(profileId, { id, title = 'New Chat', provider = 'gemini', model = 'gemini-2.0-flash' } = {}) {
    const validProfileId = resolveProfileId(profileId);
    if (!validProfileId) throw new Error('Valid user profile required');

    const sessId = id || uuidv4();
    const existing = db.prepare('SELECT id FROM ai_sessions WHERE id = ?').get(sessId);
    if (!existing) {
        const stmt = db.prepare(`
            INSERT INTO ai_sessions (id, profile_id, title, provider, model, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `);
        stmt.run(sessId, validProfileId, title, provider, model);
    }
    return getSession(validProfileId, sessId);
}

async function updateSession(profileId, sessionId, { title, model }) {
    const validProfileId = resolveProfileId(profileId);
    if (!validProfileId || !sessionId) return null;

    const current = await getSession(validProfileId, sessionId);
    if (!current) return null;

    const newTitle = title !== undefined ? title : current.title;
    const newModel = model !== undefined ? model : current.model;

    const stmt = db.prepare(`
        UPDATE ai_sessions
        SET title = ?, model = ?, updated_at = datetime('now')
        WHERE profile_id = ? AND id = ?
    `);
    stmt.run(newTitle, newModel, validProfileId, sessionId);
    return getSession(validProfileId, sessionId);
}

async function deleteSession(profileId, sessionId) {
    const validProfileId = resolveProfileId(profileId);
    if (!validProfileId || !sessionId) return { id: sessionId };

    const stmt = db.prepare(`
        DELETE FROM ai_sessions
        WHERE profile_id = ? AND id = ?
    `);
    stmt.run(validProfileId, sessionId);
    return { id: sessionId };
}

async function getMessages(profileId, sessionId) {
    const validProfileId = resolveProfileId(profileId);
    if (!validProfileId || !sessionId) return [];

    const stmt = db.prepare(`
        SELECT * FROM ai_messages
        WHERE profile_id = ? AND session_id = ?
        ORDER BY created_at ASC
    `);
    const rows = stmt.all(validProfileId, sessionId);
    const messages = [];

    for (const r of rows) {
        let toolCalls = null;
        let toolExecutions = null;
        let pendingApprovals = null;

        if (r.tool_calls) {
            try {
                const parsed = JSON.parse(r.tool_calls);
                if (Array.isArray(parsed)) {
                    if (parsed[0]?.tool) {
                        toolExecutions = parsed;
                    } else if (parsed[0]?.function) {
                        // Reconstruct pending approvals for legacy rows
                        pendingApprovals = parsed.map(tc => {
                            let fnArgs = {};
                            try {
                                fnArgs = typeof tc.function?.arguments === 'string' ? JSON.parse(tc.function.arguments) : (tc.function?.arguments || {});
                            } catch {}
                            return {
                                id: tc.id || uuidv4(),
                                tool: tc.function?.name,
                                args: fnArgs,
                                status: 'pending'
                            };
                        });
                        toolCalls = null;
                    }
                } else if (parsed && typeof parsed === 'object') {
                    toolExecutions = parsed.executions && parsed.executions.length > 0 ? parsed.executions : null;
                    toolCalls = parsed.calls && parsed.calls.length > 0 ? parsed.calls : null;
                    pendingApprovals = parsed.pending_approvals && parsed.pending_approvals.length > 0 ? parsed.pending_approvals : null;
                }
            } catch (e) {
                // ignore
            }
        }

        if (pendingApprovals && pendingApprovals.length > 0) {
            pendingApprovals = await Promise.all(
                pendingApprovals.map(item => enrichPendingApprovalItem(validProfileId, item))
            );
        }

        messages.push({
            ...r,
            tool_calls: toolCalls,
            tool_executions: toolExecutions,
            pending_approvals: pendingApprovals
        });
    }

    return messages;
}

async function addMessage(profileId, sessionId, { role, content, tool_calls, tool_call_id, tool_executions, pending_approvals }) {
    const validProfileId = resolveProfileId(profileId);
    if (!validProfileId || !sessionId) return null;

    // Ensure session exists in ai_sessions table before inserting message
    const existingSession = db.prepare('SELECT id FROM ai_sessions WHERE id = ?').get(sessionId);
    if (!existingSession) {
        db.prepare(`
            INSERT INTO ai_sessions (id, profile_id, title, provider, model, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).run(sessionId, validProfileId, 'New Chat', 'gemini', 'gemini-2.0-flash');
    }

    const id = uuidv4();
    let toolCallsStr = null;

    if (pending_approvals || tool_executions || tool_calls) {
        toolCallsStr = JSON.stringify({
            calls: tool_calls || [],
            executions: tool_executions || [],
            pending_approvals: pending_approvals || []
        });
    }

    const stmt = db.prepare(`
        INSERT INTO ai_messages (id, session_id, profile_id, role, content, tool_calls, tool_call_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    stmt.run(id, sessionId, validProfileId, role, content || '', toolCallsStr, tool_call_id || null);

    // Update session timestamp
    db.prepare(`UPDATE ai_sessions SET updated_at = datetime('now') WHERE id = ?`).run(sessionId);

    return { id, session_id: sessionId, profile_id: validProfileId, role, content, tool_calls, tool_call_id, tool_executions, pending_approvals };
}

async function updatePendingApprovalStatus(profileId, sessionId, approvalId, status, result) {
    const validProfileId = resolveProfileId(profileId);
    if (!validProfileId || !sessionId) return false;

    const stmt = db.prepare(`
        SELECT id, tool_calls FROM ai_messages
        WHERE profile_id = ? AND session_id = ? AND role = 'assistant' AND tool_calls IS NOT NULL
        ORDER BY created_at DESC
    `);
    const rows = stmt.all(validProfileId, sessionId);

    for (const row of rows) {
        try {
            const parsed = JSON.parse(row.tool_calls);
            let modified = false;

            if (parsed && typeof parsed === 'object' && Array.isArray(parsed.pending_approvals)) {
                parsed.pending_approvals = parsed.pending_approvals.map(p => {
                    if (p.id === approvalId || p.tool === approvalId || !approvalId) {
                        modified = true;
                        return { ...p, status, result: result || p.result };
                    }
                    return p;
                });
            } else if (Array.isArray(parsed) && parsed[0]?.function) {
                // Legacy format
                const newApprovals = parsed.map(tc => {
                    let fnArgs = {};
                    try { fnArgs = typeof tc.function?.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function?.arguments || {}; } catch {}
                    return {
                        id: tc.id || uuidv4(),
                        tool: tc.function?.name,
                        args: fnArgs,
                        status: (tc.id === approvalId || tc.function?.name === approvalId) ? status : 'pending',
                        result: (tc.id === approvalId || tc.function?.name === approvalId) ? result : undefined
                    };
                });
                parsed.pending_approvals = newApprovals;
                modified = true;
            }

            if (modified) {
                const updatedStr = JSON.stringify(parsed);
                db.prepare(`UPDATE ai_messages SET tool_calls = ? WHERE id = ?`).run(updatedStr, row.id);
                return true;
            }
        } catch (e) {
            // ignore
        }
    }
    return false;
}

module.exports = {
    AI_TOOLS,
    PRESET_MODELS,
    DEFAULT_ENDPOINTS,
    buildProfileContext,
    sendChatCompletion,
    executeToolCall,
    testConnection,
    fetchModels,
    normalizeEndpointUrl,
    normalizeModelsUrl,
    listSessions,
    getSession,
    createSession,
    updateSession,
    deleteSession,
    getMessages,
    addMessage,
    updatePendingApprovalStatus,
};
