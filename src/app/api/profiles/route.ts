import { createHandler } from '@/lib/api-adapter';
import { profileController } from '@/lib/controllers';

export const GET = createHandler(profileController.listProfiles);
export const POST = createHandler(profileController.createProfile);
