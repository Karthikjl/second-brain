import { createHandler } from '@/lib/api-adapter';
import { authController } from '@/lib/controllers';

export const POST = createHandler(authController.signup, { auth: false });
