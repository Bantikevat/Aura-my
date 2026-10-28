import { Router } from 'express';
import { getState, putState } from '../controllers/stateController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.get('/', getState);
router.put('/', putState);
export default router;
