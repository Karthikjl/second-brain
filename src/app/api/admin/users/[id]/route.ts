import { createHandler } from '@/lib/api-adapter';
import { adminController } from '@/lib/controllers';

export const PATCH = createHandler(adminController.updateUser, { auth: true, admin: true });
export const PUT = createHandler(adminController.updateUser, { auth: true, admin: true });
export const DELETE = createHandler(adminController.deleteUser, { auth: true, admin: true });
