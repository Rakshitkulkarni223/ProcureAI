import { Request, Response } from 'express';
import { asyncHandler, ok } from '../utils/http';
import { BasketOptimizationService } from '../services/BasketOptimizationService';
import { basketHistoryRepository } from '../repositories/BasketHistoryRepository';
import { basketSchema } from '../validators/schemas';

export const BasketController = {
  optimize: asyncHandler(async (req: Request, res: Response) => {
    const input = basketSchema.parse(req.body);
    const result = await BasketOptimizationService.optimize(req.user!.sub, input);
    return ok(res, result);
  }),

  history: asyncHandler(async (req: Request, res: Response) => {
    return ok(res, await basketHistoryRepository.listByUser(req.user!.sub));
  }),
};
