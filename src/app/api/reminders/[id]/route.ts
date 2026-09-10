import { createHandler } from '@/lib/api-adapter';
import { reminderController } from '@/lib/controllers';

export const GET = createHandler(reminderController.getReminder);
export const PATCH = createHandler(reminderController.updateReminder);
export const PUT = createHandler(reminderController.updateReminder);
export const DELETE = createHandler(reminderController.deleteReminder);
