import { createHandler } from '@/lib/api-adapter';
import { profileController } from '@/lib/controllers';

export const POST = createHandler(profileController.selectProfile);
