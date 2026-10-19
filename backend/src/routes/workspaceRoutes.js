import { Router } from 'express'; import { createWorkspace, listWorkspaces } from '../controllers/workspaceController.js'; import { requireAuth } from '../middleware/auth.js';
const router = Router(); router.use(requireAuth); router.route('/').get(listWorkspaces).post(createWorkspace); export default router;
