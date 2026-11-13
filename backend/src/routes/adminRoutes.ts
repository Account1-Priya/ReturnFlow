import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// Dashboard overview stats
router.get('/stats', adminController.getStats);

// List returns queue with filters & pagination
router.get('/returns', adminController.listAllReturns);

// Status machine transitions
router.patch('/returns/:id/review', adminController.markReview);
router.post('/returns/:id/approve', adminController.approveReturn);
router.post('/returns/:id/reject', adminController.rejectReturn);
router.post('/returns/:id/refund', adminController.refundReturn);

// Audit history
router.get('/returns/:id/history', adminController.getAuditHistory);

export default router;

