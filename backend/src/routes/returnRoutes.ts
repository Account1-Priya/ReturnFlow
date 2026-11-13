import { Router } from 'express';
import * as returnController from '../controllers/returnController';
import { authenticate } from '../middleware/authMiddleware';
import { upload } from '../services/fileService';

const router = Router();

router.use(authenticate);

// Preview refund calculation without creating a return request
router.post('/preview', returnController.previewReturn);

// Submit return request with optional image proof (max 5 files)
router.post('/', upload.array('images', 5), returnController.createReturn);

// List authenticated customer's return requests
router.get('/', returnController.listCustomerReturns);

// Get specific return request details and audit history
router.get('/:id', returnController.getReturnDetail);

// Cancel return request (allowed only in SUBMITTED state before review)
router.post('/:id/cancel', returnController.cancelReturn);

// Upload additional proof images to existing return request
router.post('/:id/images', upload.array('images', 5), returnController.uploadImages);

export default router;

