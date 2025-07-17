import { body } from 'express-validator';

export const clockInValidator = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Vĩ độ không hợp lệ.'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Kinh độ không hợp lệ.'),
]; 