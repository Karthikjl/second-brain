import { createHandler } from '@/lib/api-adapter';
import { authController } from '@/lib/controllers';

export const POST = createHandler(authController.refresh, { auth: false });
