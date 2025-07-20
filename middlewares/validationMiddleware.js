const Joi = require("joi");

const userSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("admin", "customer").default("customer"),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const productSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).optional(),
  category: Joi.alternatives()
    .try(Joi.string().min(1).max(100), Joi.string().hex().length(24))
    .required(),
  price: Joi.number().positive().precision(2).required(),
  salePrice: Joi.number().positive().precision(2).optional(),
  discountPercentage: Joi.number().min(0).max(100).precision(2).optional(),
  stock: Joi.number().integer().min(0).optional(),
  image: Joi.string().uri().optional(),
  variants: Joi.array()
    .items(
      Joi.object({
        size: Joi.string().min(1).max(50).required(),
        color: Joi.string().min(1).max(50).required(),
        quantity: Joi.number().integer().min(0).required(),
      })
    )
    .optional(),
});

const categorySchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
});

const productUpdateSchema = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(1000).optional(),
  category: Joi.alternatives()
    .try(Joi.string().min(1).max(100), Joi.string().hex().length(24))
    .optional(),
  price: Joi.number().positive().precision(2).optional(),
  salePrice: Joi.number().positive().precision(2).optional(),
  discountPercentage: Joi.number().min(0).max(100).precision(2).optional(),
  stock: Joi.number().integer().min(0).optional(),
  image: Joi.string().uri().optional(),
  variants: Joi.array()
    .items(
      Joi.object({
        size: Joi.string().min(1).max(50).required(),
        color: Joi.string().min(1).max(50).required(),
        quantity: Joi.number().integer().min(0).required(),
      })
    )
    .optional(),
});

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");
      return res.status(400).json({
        error: "Validation failed",
        details: errorMessage,
      });
    }

    req.body = value;
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");
      return res.status(400).json({
        error: "Query validation failed",
        details: errorMessage,
      });
    }

    req.query = value;
    next();
  };
};

const productQuerySchema = Joi.object({
  search: Joi.string().min(1).max(100).optional(),
  categories: Joi.string().min(1).max(100).optional(),
  minPrice: Joi.number().positive().precision(2).optional(),
  maxPrice: Joi.number().positive().precision(2).optional(),
  onSale: Joi.boolean().optional(),
  color: Joi.string().min(1).max(50).optional(),
  size: Joi.string().min(1).max(50).optional(),
  createdAfter: Joi.date().iso().optional(),
  createdBefore: Joi.date().iso().optional(),
});

const reportQuerySchema = Joi.object({
  threshold: Joi.number().integer().min(1).max(1000).optional(),
});

module.exports = {
  validate,
  validateQuery,
  userSchema,
  loginSchema,
  productSchema,
  productUpdateSchema,
  categorySchema,
  productQuerySchema,
  reportQuerySchema,
};
