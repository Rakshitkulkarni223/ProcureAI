import { Schema, model, InferSchemaType } from 'mongoose';

const basketHistorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, required: true },
    suppliers: { type: [String], default: [] },
    itemCount: { type: Number, default: 0 },
    items: {
      type: [
        {
          _id: false,
          query: String,
          quantity: Number,
          supplier: String,
          price: Number,
        },
      ],
      default: [],
    },
    splitTotal: { type: Number, default: 0 },
    baselineTotal: { type: Number, default: 0 },
    estimatedSavings: { type: Number, default: 0 },
    supplierCount: { type: Number, default: 0 },
    recommendedPlan: { type: String, default: 'split' },
    weightProfile: { type: String, default: 'balanced' },
  },
  { timestamps: true },
);

basketHistorySchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export type BasketHistoryDoc = InferSchemaType<typeof basketHistorySchema>;
export const BasketHistory = model('BasketHistory', basketHistorySchema);
