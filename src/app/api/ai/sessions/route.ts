import { createHandler } from '@/lib/api-adapter';
import { aiController } from '@/lib/controllers';

export const GET = createHandler(aiController.listSessions);
export const POST = createHandler(aiController.createSession);
