import { createHandler } from '@/lib/api-adapter';
import { adminController } from '@/lib/controllers';

export const GET = createHandler(adminController.getLockedAccounts, { auth: true, admin: true });
