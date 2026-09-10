import { createHandler } from '@/lib/api-adapter';
import { settingsController } from '@/lib/controllers';

export const GET = createHandler(settingsController.getSettings);
export const PATCH = createHandler(settingsController.updateSettings);
export const PUT = createHandler(settingsController.updateSettings);
