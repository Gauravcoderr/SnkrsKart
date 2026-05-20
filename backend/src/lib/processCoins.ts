import { Order } from '../models/Order';
import { Loyalty } from '../models/Loyalty';

const RETURN_WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export async function processPendingCoins(userId?: string): Promise<void> {
  const cutoff = new Date(Date.now() - RETURN_WINDOW_MS);
  const orders = await Order.find({
    ...(userId ? { userId } : { userId: { $exists: true, $ne: null } }),
    coinsAwarded: { $ne: true },
    coinsEarned: { $gt: 0 },
    deliveredAt: { $exists: true, $lte: cutoff },
  });

  for (const order of orders) {
    await Loyalty.findOneAndUpdate(
      { userId: order.userId },
      {
        $inc: { coins: order.coinsEarned },
        $push: {
          history: {
            type: 'earn',
            amount: order.coinsEarned,
            reason: `Order ${order.orderNumber} delivered`,
            orderId: String(order._id),
            createdAt: new Date(),
          },
        },
      },
      { upsert: true },
    );
    await Order.findByIdAndUpdate(order._id, { coinsAwarded: true });
  }
}
