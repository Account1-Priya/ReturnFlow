import { Router } from 'express';
import * as orderController from '../controllers/orderController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);
router.get('/', orderController.listOrders);
router.get('/:id', orderController.getOrder);

export default router;

