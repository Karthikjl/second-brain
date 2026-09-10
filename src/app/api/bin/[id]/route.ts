import { createHandler } from '@/lib/api-adapter';
import { binController } from '@/lib/controllers';

export const DELETE = createHandler(binController.permanentDelete);
