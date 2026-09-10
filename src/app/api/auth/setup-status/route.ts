import { createHandler } from '@/lib/api-adapter';
import { authController } from '@/lib/controllers';

export const GET = createHandler(authController.getSetupStatus, { auth: false });
