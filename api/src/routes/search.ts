import { Router } from 'express';
import { searchAll } from '../controllers/searchController';

const router = Router();

router.get('/', searchAll);

export default router;
