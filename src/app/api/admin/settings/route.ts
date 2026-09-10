import { createHandler } from '@/lib/api-adapter';
import { adminController } from '@/lib/controllers';

export const GET = createHandler(adminController.getSettings, { auth: true, admin: true });
export const PATCH = createHandler(adminController.updateSettings, { auth: true, admin: true });
export const PUT = createHandler(adminController.updateSettings, { auth: true, admin: true });
