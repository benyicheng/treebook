import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getModerationMetrics, listModerationDecisions, manualModerationDecision, exportModerationReport } from '../controllers/moderationController';

const router = Router();

router.get('/metrics', authenticate, authorize(['admin']), getModerationMetrics);
router.get('/decisions', authenticate, authorize(['admin']), listModerationDecisions);
router.post('/decisions/manual', authenticate, authorize(['admin']), manualModerationDecision);
router.get('/report', authenticate, authorize(['admin']), exportModerationReport);

export default router;

