import { Router } from 'express';
import { BasketController } from '../controllers/BasketController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/basket/optimize', authenticate, BasketController.optimize);
router.get('/basket/history', authenticate, BasketController.history);

export default router;
