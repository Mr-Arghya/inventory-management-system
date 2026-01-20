import type {
  Product,
  ProductVariant,
  StockMovement,
  Order,
  OrderItem,
  Supplier,
  PurchaseOrder,
  DashboardStats,
  ApiResponse,
  PaginatedResponse,
  User,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

export const authApi = {
  getCurrentUser: () => fetchApi<User>("/user/profile"),

  checkAuth: () =>
    fetchApi<{ success: boolean; message: string }>("/user/check"),

  sendLogin: (email: string, password: string) =>
    fetchApi<{ success: boolean; message: string }>("/user/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  sendRegister: (data: { email: string; name: string; businessName: string }) =>
    fetchApi<{ success: boolean; message: string }>("/user/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () =>
    fetchApi<{ success: boolean }>("/auth/logout", {
      method: "POST",
    }),
};

export const productsApi = {
  getAll: (params?: { page?: number; pageSize?: number; search?: string }) =>
    fetchApi<PaginatedResponse<Product>>(
      `/products?${new URLSearchParams(params as Record<string, string>).toString()}`
    ),

  getById: (id: string) => fetchApi<Product>(`/products/${id}`),

  create: (data: Partial<Product>) =>
    fetchApi<Product>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Product>) =>
    fetchApi<Product>(`/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<void>(`/products/${id}`, { method: "DELETE" }),
};

export const inventoryApi = {
  updateStock: (data: any, productId: string) =>
    fetchApi<ProductVariant>(`/stock/${productId}/update`, {
      method: "PUT",
      body: JSON.stringify({ ...data }),
    }),
  fetchInventory: () => fetchApi<Product[]>("/stock-movements"),

  adjustStock: (data: {
    productId: string
    variantId: string
    adjustmentType: string
    quantity: number
    reason: string
    owner_id: string
    user_id: string
  }) =>
    fetchApi<StockMovement>("/stock-movement/adjust", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getStockMovements: (id : string) =>
    fetchApi<PaginatedResponse<StockMovement>>(
      `/stock-movement/variant/${id}`
    ),
};

export const ordersApi = {
  getAll: (params?: { page?: number; pageSize?: number; status?: string }) =>
    fetchApi<PaginatedResponse<Order>>(
      `/orders?${new URLSearchParams(params as Record<string, string>).toString()}`
    ),

  getById: (id: string) => fetchApi<Order>(`/orders/${id}`),

  create: (data: {
    items: Partial<OrderItem>[];
    customerName?: string;
    notes?: string;
  }) =>
    fetchApi<Order>("/orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: string) =>
    fetchApi<Order>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  fulfillItem: (orderId: string, itemId: string, quantity: number) =>
    fetchApi<Order>(`/orders/${orderId}/items/${itemId}/fulfill`, {
      method: "POST",
      body: JSON.stringify({ quantity }),
    }),
};

export const suppliersApi = {
  getAll: () => fetchApi<Supplier[]>("/suppliers"),

  getById: (id: string) => fetchApi<Supplier>(`/suppliers/${id}`),

  create: (data: Partial<Supplier>) =>
    fetchApi<Supplier>("/suppliers", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Supplier>) =>
    fetchApi<Supplier>(`/suppliers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

export const purchaseOrdersApi = {
  getAll: (params?: { page?: number; pageSize?: number; status?: string }) =>
    fetchApi<PaginatedResponse<PurchaseOrder>>(
      `/purchase-orders?${new URLSearchParams(params as Record<string, string>).toString()}`
    ),

  getById: (id: string) => fetchApi<PurchaseOrder>(`/purchase-orders/${id}`),

  create: (data: Partial<PurchaseOrder>) =>
    fetchApi<PurchaseOrder>("/purchase-orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: string) =>
    fetchApi<PurchaseOrder>(`/purchase-orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  receiveItems: (id: string, items: { itemId: string; quantity: number }[]) =>
    fetchApi<PurchaseOrder>(`/purchase-orders/${id}/receive`, {
      method: "POST",
      body: JSON.stringify({ items }),
    }),
};

export const dashboardApi = {
  getStats: () => fetchApi<DashboardStats>("/dashboard"),
};
