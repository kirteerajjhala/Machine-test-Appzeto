import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000 },
    image: { type: String, trim: true },
    price: { type: mongoose.Schema.Types.Decimal128, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    stock: { type: Number, required: true, min: 0, validate: Number.isInteger },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, versionKey: false },
);

productSchema.index({ name: "text", description: "text" });

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);
export default Product;
