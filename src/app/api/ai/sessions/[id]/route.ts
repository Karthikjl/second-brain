import { createHandler } from '@/lib/api-adapter';
import { aiController } from '@/lib/controllers';

export const GET = createHandler(aiController.getSession);
export const PATCH = createHandler(aiController.updateSession);
export const DELETE = createHandler(aiController.deleteSession);
