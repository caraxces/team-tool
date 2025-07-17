import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// --- Reusable File Filters ---
const imageFileFilter = (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const csvFileFilter = (req: any, file: any, cb: any) => {
    if (file.mimetype === 'text/csv') {
        cb(null, true);
    } else {
        cb(new Error('Only .csv files are allowed!'), false);
    }
};

const jsonFileFilter = (req: any, file: any, cb: any) => {
    if (file.mimetype === 'application/json') {
        cb(null, true);
    } else {
        cb(new Error('Only .json files are allowed!'), false);
    }
};


// --- Storage Engines ---

// For saving files to disk (e.g., avatars)
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../../public/uploads/avatars');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueSuffix);
  }
});

// For processing files in memory (e.g., CSVs, JSON)
const memoryStorage = multer.memoryStorage();


// --- Exported Multer Instances ---

// For Avatar Uploads
export const uploadAvatar = multer({
    storage: avatarStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 1024 * 1024 * 5 } // 5MB
});

// For CSV Uploads
export const uploadCsv = multer({ 
    storage: memoryStorage,
    fileFilter: csvFileFilter,
    limits: { fileSize: 1024 * 1024 * 5 } // 5MB
});

// For JSON Uploads
export const uploadJson = multer({
    storage: memoryStorage,
    fileFilter: jsonFileFilter,
    limits: { fileSize: 1024 * 1024 * 1 } // 1MB
});

// For generic image uploads to memory
export const uploadImage = multer({
    storage: memoryStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 1024 * 1024 * 5 } // 5MB
}); 