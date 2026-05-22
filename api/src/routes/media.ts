import { Router } from 'express';
import multer from 'multer';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { uploadMedia, getMediaAsset } from '../controllers/mediaController';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.post('/uploads', authenticate, upload.single('file'), uploadMedia);
router.get('/assets/:id', optionalAuthenticate, getMediaAsset);

export default router;
