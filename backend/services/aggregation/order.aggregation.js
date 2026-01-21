const AGGREGATION = [
  {
    $lookup: {
      from: "users",
      localField: "created_by",
      foreignField: "_id",
      as: "createdByUser",
    },
  },
  {
    $unwind: {
      path: "$createdByUser",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $project: {
      _id: 1,
      tenantId: "$tenant_id",
      orderNumber: "$order_number",
      status: "$order_status",
      paymentStatus: "$payment_status",
      totalAmount: "$total_amount",
      currency: "$currency",
      customerName: "$customer.name",
      customerEmail: "$customer.email",
      createdAt: "$createdAt",
      updatedAt: "$updatedAt",
      items: {
        $map: {
          input: "$items",
          as: "item",
          in: {
            _id: "$$item._id",
            orderId: "$_id",
            variantId: "$$item.variant_id",
            productName: "$$item.product_name",
            variantSku: "$$item.variant_sku",
            quantity: "$$item.quantity",
            fulfilledQuantity: "$$item.fulfilled_quantity",
            unitPrice: "$$item.unit_price",
            availableStock: "$$item.available_stock",
            totalPrice: "$$item.total_price",
            itemStatus: "$$item.item_status",
          },
        },
      },
    },
  },
];

module.exports = AGGREGATION;
