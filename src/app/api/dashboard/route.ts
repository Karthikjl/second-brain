import { createHandler } from '@/lib/api-adapter';
import { dashboardController } from '@/lib/controllers';

export const GET = createHandler(dashboardController.getDashboard);
