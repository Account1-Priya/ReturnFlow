import { Router } from 'express';
import * as testController from '../controllers/testController';

const router = Router();

router.post('/reset', testController.resetDatabase);
router.post('/seed', testController.seedDatabase);

export default router;

