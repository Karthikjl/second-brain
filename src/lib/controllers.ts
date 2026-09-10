import { createRequire } from 'module';

const req = createRequire(import.meta.url);

export const authController = req('../controllers/authController');
export const taskController = req('../controllers/taskController');
export const noteController = req('../controllers/noteController');
export const habitController = req('../controllers/habitController');
export const calendarController = req('../controllers/calendarController');
export const calendarEventController = req('../controllers/calendarEventController');
export const reminderController = req('../controllers/reminderController');
export const binController = req('../controllers/binController');
export const settingsController = req('../controllers/settingsController');
export const profileController = req('../controllers/profileController');
export const aiController = req('../controllers/aiController');
export const adminController = req('../controllers/adminController');
export const dashboardController = req('../controllers/dashboardController');
