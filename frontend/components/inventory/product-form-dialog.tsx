"use client";

import type React from "react";

import { useEffect } from "react";
import { Plus, X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product } from "@/types";
import { productSchema, type ProductFormData } from "@/lib/validations";
import { productsApi } from "@/services/api";

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "NA"];

const COLOR_OPTIONS = [
  { name: "Black", value: "#000000" },
  { name: "White", value: "#FFFFFF" },
  { name: "Gray", value: "#808080" },
  { name: "Red", value: "#FF0000" },
  { name: "Blue", value: "#0000FF" },
  { name: "Green", value: "#00FF00" },
  { name: "Yellow", value: "#FFFF00" },
  { name: "Orange", value: "#FFA500" },
  { name: "Purple", value: "#800080" },
  { name: "Pink", value: "#FFC0CB" },
  { name: "Brown", value: "#8B4513" },
  { name: "Navy", value: "#000080" },
];

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

interface VariantFormData {
  _id: string;
  attributes: { size: string; color: string };
  price: string;
  cost: string;
  stock: string;
  low_threshold: string;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: ProductFormDialogProps) {
  const isEditing = !!product;

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      sku: "",
      description: "",
      category: "",
      variants: [
        {
          attributes: { size: "", color: "" },
          price: 0,
          cost: 0,
          stock: 0,
          low_threshold: 10,
        },
      ],
    },
  });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control,
    name: "variants",
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.sku,
        description: product.description || "",
        category: product.category || "",
        variants: product.variants.map((v) => ({
          _id: v._id,
          attributes: {
            size: (v.attributes.size as string) || "",
            color: (v.attributes.color as string) || "",
          },
          price: v.price,
          cost: v.cost,
          stock: v.stock,
          low_threshold: v.low_threshold,
          pendingPurchaseOrderQuantity: v.pendingPurchaseOrderQuantity,
        })),
      });
    } else {
      reset({
        name: "",
        sku: "",
        description: "",
        category: "",
        variants: [
          {
            attributes: { size: "", color: "" },
            price: 0,
            cost: 0,
            stock: 0,
            low_threshold: 10,
            pendingPurchaseOrderQuantity: 0,
          },
        ],
      });
    }
  }, [product, reset]);

  const onSubmit = async (data: ProductFormData) => {
    // In production, this would call the API
    productsApi.create(data);
    console.log("[v0] Product form submitted:", data);
    onOpenChange(false);
  };

  const addVariant = () => {
    appendVariant({
      attributes: { size: "", color: "" },
      price: 0,
      cost: 0,
      stock: 0,
      low_threshold: 10,
      pendingPurchaseOrderQuantity: 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Product" : "Add New Product"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Classic T-Shirt"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">Base SKU</Label>
              <Input
                id="sku"
                {...register("sku")}
                placeholder="TSH"
                className={errors.sku ? "border-destructive" : ""}
              />
              {errors.sku && (
                <p className="text-sm text-destructive">{errors.sku.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              {...register("category")}
              placeholder="Apparel"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Product description..."
              rows={3}
            />
          </div>

          {/* Variants */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Variants</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVariant}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Variant
              </Button>
            </div>

            {variantFields.map((variant, index) => (
              <div
                key={variant.id}
                className="rounded-lg border border-border p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Variant {index + 1}
                  </span>
                  {variantFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariant(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Attributes */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Size</Label>
                    <Controller
                      control={control}
                      name={`variants.${index}.attributes.size`}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Size" />
                          </SelectTrigger>
                          <SelectContent>
                            {SIZE_OPTIONS.map((size) => (
                              <SelectItem key={size} value={size}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.variants?.[index]?.attributes?.size && (
                      <p className="text-xs text-destructive">
                        {errors.variants[index]?.attributes?.size?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Color</Label>
                    <Controller
                      control={control}
                      name={`variants.${index}.attributes.color`}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Color" />
                          </SelectTrigger>
                          <SelectContent>
                            {COLOR_OPTIONS.map((color) => (
                              <SelectItem key={color.value} value={color.value}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-4 h-4 rounded-full border border-gray-300"
                                    style={{ backgroundColor: color.value }}
                                  />
                                  {color.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.variants?.[index]?.attributes?.color && (
                      <p className="text-xs text-destructive">
                        {errors.variants[index]?.attributes?.color?.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Pricing & Stock */}
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`variants.${index}.price`, { valueAsNumber: true })}
                      placeholder="29.99"
                      className={
                        errors.variants?.[index]?.price
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {errors.variants?.[index]?.price && (
                      <p className="text-xs text-destructive">
                        {errors.variants[index]?.price?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cost</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`variants.${index}.cost`, { valueAsNumber: true })}
                      placeholder="12.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Stock</Label>
                    <Input
                      type="number"
                      {...register(`variants.${index}.stock`, { valueAsNumber: true })}
                      placeholder="0"
                      className={
                        errors.variants?.[index]?.stock
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {errors.variants?.[index]?.stock && (
                      <p className="text-xs text-destructive">
                        {errors.variants[index]?.stock?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Low Threshold</Label>
                    <Input
                      type="number"
                      {...register(`variants.${index}.low_threshold`,{ valueAsNumber: true })}
                      placeholder="10"
                      className={
                        errors.variants?.[index]?.low_threshold
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {errors.variants?.[index]?.low_threshold && (
                      <p className="text-xs text-destructive">
                        {errors.variants[index]?.low_threshold?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Peding Purchase Order</Label>
                    <Input
                      type="number"
                      {...register(
                        `variants.${index}.pendingPurchaseOrderQuantity`, { valueAsNumber: true }
                      )}
                      placeholder="10"
                      className={
                        errors.variants?.[index]?.pendingPurchaseOrderQuantity
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {errors.variants?.[index]?.pendingPurchaseOrderQuantity && (
                      <p className="text-xs text-destructive">
                        {
                          errors.variants[index]?.pendingPurchaseOrderQuantity
                            ?.message
                        }
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
