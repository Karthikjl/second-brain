import { createHandler } from '@/lib/api-adapter';
import { adminController } from '@/lib/controllers';

export const POST = createHandler(adminController.impersonateUser, { auth: true, admin: true });
