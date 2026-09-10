import { createHandler } from '@/lib/api-adapter';
import { calendarEventController } from '@/lib/controllers';

export const GET = createHandler(calendarEventController.getCalendarEvent);
export const PATCH = createHandler(calendarEventController.updateCalendarEvent);
export const PUT = createHandler(calendarEventController.updateCalendarEvent);
export const DELETE = createHandler(calendarEventController.deleteCalendarEvent);
