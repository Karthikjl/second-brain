import { createHandler } from '@/lib/api-adapter';
import { reminderController } from '@/lib/controllers';

export const POST = createHandler(reminderController.snoozeReminder);
