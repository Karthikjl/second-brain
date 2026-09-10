import { createHandler } from '@/lib/api-adapter';
import { calendarEventController } from '@/lib/controllers';

export const GET = createHandler(calendarEventController.listCalendarEvents);
export const POST = createHandler(calendarEventController.createCalendarEvent);
