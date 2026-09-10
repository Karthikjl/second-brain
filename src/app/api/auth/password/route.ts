import { createHandler } from '@/lib/api-adapter';
import { authController } from '@/lib/controllers';

export const PATCH = createHandler(authController.changePassword);
export const POST = createHandler(authController.changePassword);
