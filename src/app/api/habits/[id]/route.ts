import { createHandler } from '@/lib/api-adapter';
import { habitController } from '@/lib/controllers';

export const GET = createHandler(habitController.getHabit);
export const PATCH = createHandler(habitController.updateHabit);
export const PUT = createHandler(habitController.updateHabit);
export const DELETE = createHandler(habitController.deleteHabit);
