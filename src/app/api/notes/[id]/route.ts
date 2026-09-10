import { createHandler } from '@/lib/api-adapter';
import { noteController } from '@/lib/controllers';

export const GET = createHandler(noteController.getNote);
export const PATCH = createHandler(noteController.updateNote);
export const PUT = createHandler(noteController.updateNote);
export const DELETE = createHandler(noteController.deleteNote);
