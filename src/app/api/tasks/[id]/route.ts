import { createHandler } from '@/lib/api-adapter';
import { taskController } from '@/lib/controllers';

export const GET = createHandler(taskController.getTask);
export const PATCH = createHandler(taskController.updateTask);
export const PUT = createHandler(taskController.updateTask);
export const DELETE = createHandler(taskController.deleteTask);
