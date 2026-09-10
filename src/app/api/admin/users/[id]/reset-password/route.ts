import { createHandler } from '@/lib/api-adapter';
import { adminController } from '@/lib/controllers';

export const POST = createHandler(adminController.resetPassword, { auth: true, admin: true });
