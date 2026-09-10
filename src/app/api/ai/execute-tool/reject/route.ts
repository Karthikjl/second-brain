import { createHandler } from '@/lib/api-adapter';
import { aiController } from '@/lib/controllers';

export const POST = createHandler(aiController.rejectTool);
