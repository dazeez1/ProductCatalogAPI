const mongoose = require("mongoose");
const Category = require("./categories");

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Categories",
    required: true,
  },
  price: { type: Number, required: true },
  salePrice: { type: Number, default: null },
  discountPercentage: { type: Number, min: 0, max: 100, default: 0 },
  isOnSale: { type: Boolean, default: false },
  stock: { type: Number, required: true, default: 0 },
  image: { type: String, required: false },
  variants: [{ size: String, color: String, quantity: Number }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ProductSchema.pre("save", async function (next) {
  try {
    this.updatedAt = new Date();

    if (typeof this.category === "string") {
      let category = await Category.findOne({ name: this.category });
      if (!category) {
        category = new Category({ name: this.category });
        await category.save();
      }
      this.category = category._id;
    }

    if (this.variants && this.variants.length > 0) {
      this.stock = this.variants.reduce(
        (total, variant) => total + (variant.quantity || 0),
        0
      );
    } else {
      this.stock = 0;
    }

    if (this.discountPercentage > 0) {
      this.salePrice = this.price * (1 - this.discountPercentage / 100);
      this.isOnSale = true;
    } else if (this.salePrice) {
      this.discountPercentage =
        ((this.price - this.salePrice) / this.price) * 100;
      this.isOnSale = true;
    } else {
      this.isOnSale = false;
    }

    next();
  } catch (err) {
    next(err);
  }
});

ProductSchema.virtual("finalPrice").get(function () {
  return this.salePrice || this.price;
});

ProductSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("products", ProductSchema);
