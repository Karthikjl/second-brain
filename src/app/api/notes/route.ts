import { createHandler } from '@/lib/api-adapter';
import { noteController } from '@/lib/controllers';

export const GET = createHandler(noteController.listNotes);
export const POST = createHandler(noteController.createNote);
