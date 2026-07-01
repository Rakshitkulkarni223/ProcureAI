import { BasketHistory } from '../models/BasketHistory';

export class BasketHistoryRepository {
  create(data: Record<string, unknown>) {
    return BasketHistory.create(data);
  }

  listByUser(userId: string, limit = 50) {
    return BasketHistory.find({ userId }).sort({ createdAt: -1 }).limit(limit);
  }
}

export const basketHistoryRepository = new BasketHistoryRepository();
