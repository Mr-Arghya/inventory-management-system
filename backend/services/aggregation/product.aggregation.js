const AGGREGATION = [
  {
    $lookup: {
      from: "categories",
      localField: "categories",
      foreignField: "_id",
      pipeline: [
        {
          $match: {
            is_deleted: false,
          },
        },
      ],
      as: "Category",
    },
  },
  {
    $unwind: {
      path: "$Category",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "sub_categories",
      localField: "sub_category_id",
      foreignField: "_id",
      as: "SubCategory",
    },
  },
  {
    $unwind: {
      path: "$SubCategory",
      preserveNullAndEmptyArrays: true,
    },
  },
];

module.exports = AGGREGATION;
