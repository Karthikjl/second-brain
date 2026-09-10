import { createHandler } from '@/lib/api-adapter';
import { noteController } from '@/lib/controllers';

export const POST = createHandler(noteController.convertNoteToTask);
