import { createHandler } from '@/lib/api-adapter';
import { binController } from '@/lib/controllers';

export const GET = createHandler(binController.listBin);
