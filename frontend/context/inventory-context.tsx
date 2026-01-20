"use client"
import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode, type Dispatch } from "react"
import type { Product, LowStockItem, StockMovement } from "@/types"
import { inventoryApi } from "@/services/api"
import { useAuth } from "./auth-context"

interface InventoryState {
  products: Product[]
  isLoading: boolean
  error: string | null
  lowStockAlerts: LowStockItem[]
  lastUpdated: string | null
}

type InventoryAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_PRODUCTS"; payload: Product[] }
  | { type: "ADD_PRODUCT"; payload: Product }
  | { type: "UPDATE_PRODUCT"; payload: Product }
  | { type: "DELETE_PRODUCT"; payload: string }
  | { type: "UPDATE_VARIANT_STOCK"; payload: { variantId: string; newStock: number } }
  | { type: "SET_LOW_STOCK_ALERTS"; payload: LowStockItem[] }
  | { type: "ADD_LOW_STOCK_ALERT"; payload: LowStockItem }

const initialState: InventoryState = {
  products: [],
  isLoading: false,
  error: null,
  lowStockAlerts: [],
  lastUpdated: null,
}

function inventoryReducer(state: InventoryState, action: InventoryAction): InventoryState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }

    case "SET_ERROR":
      return { ...state, error: action.payload }

    case "SET_PRODUCTS":
      return {
        ...state,
        products: action.payload,
        lastUpdated: new Date().toISOString(),
      }

    case "ADD_PRODUCT":
      return {
        ...state,
        products: [...state.products, action.payload],
      }

    case "UPDATE_PRODUCT":
      return {
        ...state,
        products: state.products.map((p) => (p._id === action.payload._id ? action.payload : p)),
      }

    case "DELETE_PRODUCT":
      return {
        ...state,
        products: state.products.filter((p) => p._id !== action.payload),
      }

    case "UPDATE_VARIANT_STOCK": {
      const { variantId, newStock } = action.payload
      return {
        ...state,
        products: state.products.map((product) => ({
          ...product,
          variants: product.variants.map((variant) =>
            variant._id === variantId ? { ...variant, stock: newStock } : variant,
          ),
        })),
        lastUpdated: new Date().toISOString(),
      }
    }

    case "SET_LOW_STOCK_ALERTS":
      return { ...state, lowStockAlerts: action.payload }

    case "ADD_LOW_STOCK_ALERT":
      return {
        ...state,
        lowStockAlerts: [...state.lowStockAlerts, action.payload],
      }

    default:
      return state
  }
}

interface InventoryContextValue {
  state: InventoryState
  dispatch: Dispatch<InventoryAction>
  updateStockOptimistically: (variantId: string, quantityChange: number, onError: () => void) => void
  adjustStock: (data: {
    productId: string
    variantId: string
    adjustmentType: string
    quantity: number
    reason: string
  }) => Promise<void>
  getStockMovements: (variantId: string) => Promise<StockMovement[] | null>
}

const InventoryContext = createContext<InventoryContextValue | undefined>(undefined)

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(inventoryReducer, initialState)
  const { user } = useAuth()

  const updateStockOptimistically = useCallback(
    (variantId: string, quantityChange: number, onError: () => void) => {
      let currentStock = 0
      for (const product of state.products) {
        const variant = product.variants.find((v) => v._id === variantId)
        if (variant) {
          currentStock = variant.stock
          break
        }
      }

      dispatch({
        type: "UPDATE_VARIANT_STOCK",
        payload: { variantId, newStock: currentStock + quantityChange },
      })
    },
    [state.products],
  )

  const adjustStock = useCallback(
    async (data: {
      productId: string
      variantId: string
      adjustmentType: string
      quantity: number
      reason: string
    }) => {
      if (!user?.owner_id || !user?._id) {
        dispatch({ type: "SET_ERROR", payload: "User not authenticated" })
        return
      }
      let currentStock = 0
      for (const product of state.products) {
        const variant = product.variants.find((v) => v._id === data.variantId)
        if (variant) {
          currentStock = variant.stock
          break
        }
      }
      const newStock = currentStock + data.quantity
      dispatch({
        type: "UPDATE_VARIANT_STOCK",
        payload: { variantId: data.variantId, newStock },
      })

      try {
        const response = await inventoryApi.adjustStock({
          productId: data.productId,
          variantId: data.variantId,
          adjustmentType: data.adjustmentType,
          quantity: data.quantity,
          reason: data.reason,
          owner_id: user.owner_id,
          user_id: user._id,
        })
        if (response.data?.newStock !== undefined) {
          dispatch({
            type: "UPDATE_VARIANT_STOCK",
            payload: { variantId: data.variantId, newStock: response.data.newStock },
          })
        }
      } catch (error) {
        dispatch({
          type: "UPDATE_VARIANT_STOCK",
          payload: { variantId: data.variantId, newStock: currentStock },
        })
        dispatch({ type: "SET_ERROR", payload: "Failed to adjust stock" })
        throw error
      }
    },
    [state.products, user],
  )

  const getStockMovements = useCallback(
    async (variantId: string) => {
      const response = await inventoryApi.getStockMovements(variantId)
      return response.data
    },
    [],
  )
  

  return (
    <InventoryContext.Provider value={{ state, dispatch, updateStockOptimistically, adjustStock, getStockMovements }}>
      {children}
    </InventoryContext.Provider>
  )
}

export function useInventory() {
  const context = useContext(InventoryContext)
  if (context === undefined) {
    throw new Error("useInventory must be used within an InventoryProvider")
  }
  return context
}
