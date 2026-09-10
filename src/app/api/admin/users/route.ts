import { createHandler } from '@/lib/api-adapter';
import { adminController } from '@/lib/controllers';

export const GET = createHandler(adminController.getUsers, { auth: true, admin: true });
export const POST = createHandler(adminController.createUser, { auth: true, admin: true });
