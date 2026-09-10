import { createHandler } from '@/lib/api-adapter';
import { taskController } from '@/lib/controllers';

export const GET = createHandler(taskController.listTasks);
export const POST = createHandler(taskController.createTask);
