import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, trim: true, uppercase: true },
    attributes: {
      type: Map,
      of: { type: String, trim: true, maxlength: 50 },
      required: true,
    },
    price: { type: mongoose.Schema.Types.Decimal128, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    stock: { type: Number, required: true, min: 0, validate: Number.isInteger },
    images: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
  },
  { _id: true },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000 },
    images: [{ type: String, trim: true }],
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
      maxlength: 100,
    },
    price: { type: mongoose.Schema.Types.Decimal128, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    stock: { type: Number, required: true, min: 0, validate: Number.isInteger },
    variants: { type: [variantSchema], default: [] },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, versionKey: false },
);

productSchema.index({ sku: 1 }, { unique: true });
productSchema.index({ "variants.sku": 1 }, { unique: true, sparse: true });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ name: "text", description: "text", category: "text" });

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);
export default Product;
