import { createHandler } from '@/lib/api-adapter';
import { reminderController } from '@/lib/controllers';

export const GET = createHandler(reminderController.listReminders);
export const POST = createHandler(reminderController.createReminder);
