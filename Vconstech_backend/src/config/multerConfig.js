import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directories if they don't exist
const projectFilesDir = path.join(__dirname, '../../uploads/project-files');
const logosDir = path.join(__dirname, '../../uploads/logos');
const materialFilesDir = path.join(__dirname, '../../uploads/material-files');

if (!fs.existsSync(projectFilesDir)) {
  fs.mkdirSync(projectFilesDir, { recursive: true });
}

if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}
if (!fs.existsSync(materialFilesDir)) fs.mkdirSync(materialFilesDir, { recursive: true });

// ==================== PROJECT FILES UPLOAD ====================

// Configure storage for project files
const projectFilesStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, projectFilesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for project files
const projectFilesFilter = (req, file, cb) => {
  const allowedExtensions = [
    '.pdf', '.doc', '.docx',
    '.jpg', '.jpeg', '.png',
    '.xlsx', '.xls',
    '.dwg', '.dxf',
    '.skp', '.obj', '.fbx',
    '.3ds', '.stl', '.rvt', '.ifc'
  ];
  
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${ext}`));
  }
};

export const upload = multer({
  storage: projectFilesStorage,
  fileFilter: projectFilesFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// ==================== LOGO UPLOAD ====================

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, logosDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const logoFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

export const uploadLogo = multer({
  storage: logoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: logoFileFilter
});

// ==================== MATERIAL FILES UPLOAD ====================  ← ADD THIS BLOCK

const materialFilesStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, materialFilesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'material-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const materialFilesFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${ext}. Only PDF, JPG, PNG allowed.`));
  }
};

export const uploadMaterialFiles = multer({
  storage: materialFilesStorage,
  fileFilter: materialFilesFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});