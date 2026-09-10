import { createHandler } from '@/lib/api-adapter';
import { calendarController } from '@/lib/controllers';

export const GET = createHandler(calendarController.getCalendarData);
