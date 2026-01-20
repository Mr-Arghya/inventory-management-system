const AuthService = require("./auth.service");
const UserService = require("./user.service");
const OtpService = require("./otp.service");
const CategoryService = require("./category.service");
const ProductService = require("./product.service");
const SubCategoryService = require("./subCategory.service");
const Aggregation = require("./aggregation");
const Models = require("../models");
const StockMovementService = require("./stock-movement.service");
const OrderService = require("./order.service");
const DashboardService = require("./dashboard.service");

const GenerateSearchService = async ({ collection, search_value }) => {
  const regex = new RegExp(search_value, "i");
  const searchObject = { $or: [] };
  const pipeline = Aggregation[collection + "AGGREGATION"] || [];
  const [result] = await Models[collection].aggregate([
    ...pipeline,
    {
      $project: {
        fields: {
          $objectToArray: "$$ROOT",
        },
      },
    },
    {
      $unwind: "$fields",
    },
    {
      $match: {
        "fields.k": {
          $nin: ["is_deleted", "is_active", "_id", "__v"],
        },
      },
    },
    {
      $addFields: {
        fieldCount: {
          $size: {
            $filter: {
              input: { $objectToArray: "$$ROOT" },
              as: "field",
              cond: {
                $not: {
                  $in: ["$$field.k", ["_id", "__v", "is_deleted", "is_active"]],
                },
              },
            },
          },
        },
      },
    },
    {
      $sort: {
        fieldCount: -1,
      },
    },
    {
      $project: {
        field: "$fields.k",
        value: "$fields.v",
      },
    },
    {
      $set: {
        nestedFields: {
          $cond: {
            if: { $eq: [{ $type: "$value" }, "object"] },
            then: {
              $map: {
                input: { $objectToArray: "$value" },
                as: "nested",
                in: {
                  k: { $concat: ["$field", ".", "$$nested.k"] },
                  v: "$$nested.v",
                },
              },
            },
            else: [],
          },
        },
      },
    },
    {
      $unwind: {
        path: "$nestedFields",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: null,
        fieldNames: {
          $addToSet: "$field",
        },
        nestedFieldNames: {
          $addToSet: "$nestedFields.k",
        },
      },
    },
    {
      $project: {
        fieldNames: {
          $setUnion: ["$fieldNames", "$nestedFieldNames"],
        },
      },
    },
  ]);
  if (!result) {
    return {};
  }
  const { fieldNames } = result;
  if (!fieldNames.length) {
    return {};
  }
  for (let i = 0; i < fieldNames.length; i++) {
    searchObject.$or.push({ [fieldNames[i]]: regex });
  }
  return searchObject;
};

module.exports = {
  AuthService,
  UserService,
  OtpService,
  CategoryService,
  ProductService,
  SubCategoryService,
  GenerateSearchService,
  StockMovementService,
  OrderService,
  DashboardService
};
