import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .min(2, "Name must be at least 2 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    businessName: z
      .string()
      .min(1, "Business name is required")
      .min(2, "Business name must be at least 2 characters"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(6, "Password must be at least 6 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .strict()
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

const variantAttributeSchema = z.object({
  size: z.string().min(1, "Size is required"),
  color: z.string().min(1, "Color is required"),
});

const variantFormSchema = z.object({
  attributes: variantAttributeSchema,
  price: z.number().min(1, "Price is required"),
  cost: z.number().min(1, "Cost is required"),
  stock: z.number().min(1, "Stock is required"),
  low_threshold: z.number().min(1, "Low stock threshold is required"),
  pendingPurchaseOrderQuantity: z.number().min(0),
});

export const productSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .min(2, "Product name must be at least 2 characters"),
  sku: z
    .string()
    .min(1, "SKU is required")
    .min(2, "SKU must be at least 2 characters"),
  description: z.string().optional(),
  category: z.string().optional(),
  variants: z
    .array(variantFormSchema)
    .min(1, "At least one variant is required"),
});

export type ProductFormData = z.infer<typeof productSchema>;

export const stockAdjustmentSchema = z.object({
  type: z.enum(["purchase", "sale", "return", "adjustment"], {
    required_error: "Please select an adjustment type",
  }),
  quantity: z.string().min(1, "Quantity is required"),
  notes: z.string().optional(),
});

export type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>;

const orderLineItemSchema = z.object({
  variantId: z.string(),
  productName: z.string(),
  variantSku: z.string(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().positive("Price must be positive"),
});

export const createOrderSchema = z.object({
  customerName: z.string().optional(),
  customerEmail: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  notes: z.string().optional(),
  items: z.array(orderLineItemSchema).min(1, "At least one item is required"),
});

export type CreateOrderFormData = z.infer<typeof createOrderSchema>;

const purchaseOrderLineItemSchema = z.object({
  variantId: z.string(),
  productName: z.string(),
  sku: z.string(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().positive("Price must be positive"),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Please select a supplier"),
  expectedDeliveryDate: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(purchaseOrderLineItemSchema)
    .min(1, "At least one item is required"),
});

export type CreatePurchaseOrderFormData = z.infer<
  typeof createPurchaseOrderSchema
>;

export const supplierSchema = z.object({
  name: z
    .string()
    .min(1, "Supplier name is required")
    .min(2, "Supplier name must be at least 2 characters"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;
