import { createHandler } from '@/lib/api-adapter';
import { habitController } from '@/lib/controllers';

export const GET = createHandler(habitController.listHabits);
export const POST = createHandler(habitController.createHabit);
