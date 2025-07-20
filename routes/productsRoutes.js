const express = require("express");
const rateLimit = require("express-rate-limit");
const Product = require("../models/products");
const Category = require("../models/categories");
const User = require("../models/user");
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const {
  validate,
  validateQuery,
  productSchema,
  productUpdateSchema,
  productQuerySchema,
  reportQuerySchema,
} = require("../middlewares/validationMiddleware");

const router = express.Router();

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const isAdmin = authorize("admin");

router.use(limiter);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               category:
 *                 type: string
 *               price:
 *                 type: number
 *                 minimum: 0
 *               salePrice:
 *                 type: number
 *                 minimum: 0
 *               discountPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *               image:
 *                 type: string
 *                 format: uri
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     size:
 *                       type: string
 *                     color:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                       minimum: 0
 *     responses:
 *       201:
 *         description: Product created successfully
 *       200:
 *         description: Stock updated for existing product
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post(
  "/",
  authenticate,
  isAdmin,
  validate(productSchema),
  async (req, res) => {
    try {
      let productData = req.body;

      if (typeof productData.category === "string") {
        let category = await Category.findOne({
          name: { $regex: new RegExp(`^${productData.category}$`, "i") },
        });

        if (!category) {
          category = new Category({ name: productData.category });
          await category.save();
        }
        productData.category = category._id;
      }

      const existingProduct = await Product.findOne({
        name: { $regex: new RegExp(`^${productData.name}$`, "i") },
        category: productData.category,
        "variants.size": { $in: productData.variants.map((v) => v.size) },
        "variants.color": { $in: productData.variants.map((v) => v.color) },
      });

      if (existingProduct) {
        existingProduct.stock += productData.stock || 0;

        productData.variants.forEach((newVariant) => {
          let existingVariant = existingProduct.variants.find(
            (variant) =>
              variant.size === newVariant.size &&
              variant.color === newVariant.color
          );

          if (existingVariant) {
            existingVariant.quantity += newVariant.quantity;
          } else {
            existingProduct.variants.push(newVariant);
          }
        });

        await existingProduct.save();
        return res.status(200).json({
          message: "Stock updated for existing product",
          product: existingProduct,
        });
      }

      const product = await Product.create(productData);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products with search and filtering
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product name
 *       - in: query
 *         name: categories
 *         schema:
 *           type: string
 *         description: Filter by category name
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: onSale
 *         schema:
 *           type: boolean
 *         description: Filter products on sale
 *       - in: query
 *         name: color
 *         schema:
 *           type: string
 *         description: Filter by variant color
 *       - in: query
 *         name: size
 *         schema:
 *           type: string
 *         description: Filter by variant size
 *       - in: query
 *         name: createdAfter
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by creation date (after)
 *       - in: query
 *         name: createdBefore
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by creation date (before)
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   category:
 *                     type: object
 *                   price:
 *                     type: number
 *                   salePrice:
 *                     type: number
 *                   discountPercentage:
 *                     type: number
 *                   isOnSale:
 *                     type: boolean
 *                   stock:
 *                     type: integer
 *                   variants:
 *                     type: array
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.get("/", validateQuery(productQuerySchema), async (req, res) => {
  try {
    let query = {};

    if (req.query.search || req.query.color || req.query.size) {
      query.$or = [];

      if (req.query.search) {
        query.$or.push({ name: { $regex: new RegExp(req.query.search, "i") } });
      }

      if (req.query.color) {
        query.$or.push({
          "variants.color": { $regex: new RegExp(req.query.color, "i") },
        });
      }

      if (req.query.size) {
        query.$or.push({
          "variants.size": { $regex: new RegExp(req.query.size, "i") },
        });
      }
    }

    if (req.query.categories) {
      const category = await Category.findOne({
        name: { $regex: new RegExp(`^${req.query.categories}$`, "i") },
      });

      if (!category) {
        return res
          .status(400)
          .json({ error: `Category '${req.query.categories}' not found` });
      }

      query.category = category._id;
    }

    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
    }

    if (req.query.onSale === "true") {
      query.isOnSale = true;
    }

    if (req.query.createdAfter) {
      query.createdAt = { $gte: new Date(req.query.createdAfter) };
    }
    if (req.query.createdBefore) {
      query.createdAt = {
        ...query.createdAt,
        $lte: new Date(req.query.createdBefore),
      };
    }

    const products = await Product.find(query)
      .populate("category", "name")
      .select("-_stock")
      .lean();

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select("-_stock");
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", authenticate, isAdmin, async (req, res) => {
  try {
    let productData = req.body;

    if (typeof productData.category === "string") {
      const category = await Category.findOne({
        name: { $regex: new RegExp(`^${productData.category}$`, "i") },
      });

      if (category) {
        productData.category = category._id;
      } else {
        const newCategory = new Category({ name: productData.category });
        await newCategory.save();
        productData.category = newCategory._id;
      }
    }

    let existingProduct = await Product.findById(req.params.id);
    if (!existingProduct)
      return res.status(404).json({ error: "Product not found" });

    if (productData.stock) {
      existingProduct.stock += productData.stock;
    }

    if (productData.variants && productData.variants.length > 0) {
      productData.variants.forEach((newVariant) => {
        let existingVariant = existingProduct.variants.find(
          (variant) =>
            variant.size === newVariant.size &&
            variant.color === newVariant.color
        );

        if (existingVariant) {
          existingVariant.quantity += newVariant.quantity;
        } else {
          existingProduct.variants.push(newVariant);
        }
      });
    }

    Object.assign(existingProduct, productData);

    await existingProduct.save();

    res.json({
      message: "Product updated successfully",
      product: existingProduct,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/reports/low-stock", authenticate, isAdmin, async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    const lowStockProducts = await Product.find({ stock: { $lt: threshold } })
      .populate("category", "name")
      .select("name category stock price variants")
      .lean();

    res.json({
      threshold,
      count: lowStockProducts.length,
      products: lowStockProducts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/reports/on-sale", authenticate, isAdmin, async (req, res) => {
  try {
    const saleProducts = await Product.find({ isOnSale: true })
      .populate("category", "name")
      .select("name category price salePrice discountPercentage stock")
      .lean();

    const totalDiscountValue = saleProducts.reduce((total, product) => {
      return total + (product.price - product.salePrice) * product.stock;
    }, 0);

    res.json({
      count: saleProducts.length,
      totalDiscountValue: totalDiscountValue.toFixed(2),
      products: saleProducts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/reports/inventory", authenticate, isAdmin, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalStock = await Product.aggregate([
      { $group: { _id: null, totalStock: { $sum: "$stock" } } },
    ]);

    const categorySummary = await Product.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $group: {
          _id: "$category",
          categoryName: { $first: "$categoryInfo.name" },
          productCount: { $sum: 1 },
          totalStock: { $sum: "$stock" },
        },
      },
    ]);

    res.json({
      totalProducts,
      totalStock: totalStock[0]?.totalStock || 0,
      categorySummary,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
