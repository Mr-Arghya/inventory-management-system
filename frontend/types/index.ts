/**
 * Core type definitions for the inventory management platform.
 * All types are designed to support multi-tenant architecture with role-based access.
 */

// User roles with hierarchical permissions
export type UserRole = "owner" | "manager" | "staff";

// Auth-related types for login/register flows
export type AuthStep = "email" | "otp" | "complete";

export interface AuthState {
  step: AuthStep;
  email: string;
  isLoading: boolean;
  error: string | null;
}

export interface RegisterFormData {
  email: string;
  name: string;
  businessName: string;
  password: string;
  confirm_password: string;
  user_type: string;
}

// Tenant and user types
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  settings: TenantSettings;
}

export interface TenantSettings {
  low_threshold: number;
  currency: string;
  timezone: string;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  user_type: UserRole;
  owner_id: string;
  avatar?: string;
}

// Product and inventory types
export interface Product {
  _id: string;
  tenant_id: string;
  name: string;
  sku: string;
  description?: string;
  category?: string;
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  _id?: string;
  product_id?: string;
  attributes: Record<string, string>;
  stock: number;
  price: number;
  cost: number;
  low_threshold: number;
  pendingPurchaseOrderQuantity: number;
}

// Stock movement types
export type MovementType = "purchase" | "sale" | "return" | "adjustment";

export interface StockMovement {
  _id: string;
  variantId: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reference?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

// Order types
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "partially_fulfilled"
  | "fulfilled"
  | "cancelled"
  | "refunded"
  | "failed";

export interface Order {
  _id: string;
  tenantId: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  customerName?: string;
  customerEmail?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  _id: string;
  orderId: string;
  variantId: string;
  productName: string;
  variantSku: string;
  quantity: number;
  fulfilledQuantity: number;
  unitPrice: number;
  availableStock: number;
}

// Supplier types
export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  products: SupplierProduct[];
  createdAt: string;
}

export interface SupplierProduct {
  variantId: string;
  price: number;
  leadTimeDays: number;
}

// Purchase order types
export type PurchaseOrderStatus = "draft" | "sent" | "confirmed" | "received";

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  totalAmount: number;
  expectedDeliveryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  variantId: string;
  productName: string;
  variantSku: string;
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  expectedPrice: number;
  priceVariance: number;
}

// Dashboard analytics types
export interface DashboardStats {
  inventoryValuation: number;
  totalProducts: number;
  lowStockItems: LowStockItem[];
  topSellingProducts: TopSellingProduct[];
  stockMovementData: StockMovementChartData[];
}

export interface LowStockItem {
  variantId: string;
  productName: string;
  variantSku: string;
  currentStock: number;
  threshold: number;
  pendingPOQuantity: number;
  isSuppressed: boolean;
}

export interface TopSellingProduct {
  productId: string;
  productName: string;
  totalSold: number;
  revenue: number;
}

export interface StockMovementChartData {
  date: string;
  purchases: number;
  sales: number;
  returns: number;
  adjustments: number;
}

export interface ApiResponse<T> {
  data: any;
  success: boolean;
  message?: string;
  status: number;
  error: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
