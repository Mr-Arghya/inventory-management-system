const { User } = require("../models");
const NotificationService = require("./notification.service");

const UserService = {
  async createUser(data) {
    const user = (await User.create(data)).toJSON();
    return user;
  },
  async findOneUser(filter) {
    const pipeline = [
      {
        $match: {
          ...filter,
          is_deleted: false,
        },
      },
      {
        $lookup: {
          from: "users",
          let: { loggedInUserId: "$_id", userType: "$user_type" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user_type", "owner"] },
                    { $eq: ["$is_deleted", false] },
                  ],
                },
              },
            },
            { $unwind: "$tenant" },
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$tenant.user_id", "$$loggedInUserId"] },
                    { $eq: ["$tenant.is_removed", false] },
                  ],
                },
              },
            },
            {
              $project: {
                owner_id: "$_id",
              },
            },
          ],
          as: "owner",
        },
      },
      {
        $addFields: {
          owner_id: {
            $cond: [
              { $eq: ["$user_type", "owner"] },
              "$_id",
              { $arrayElemAt: ["$owner.owner_id", 0] },
            ],
          },
        },
      },
      {
        $project: {
          owner: 0,
        },
      },
    ];
    const user = await User.aggregate(pipeline);
    return user[0] || null;
  },
  async findAllUsers({ sort = { createdAt: -1 }, filter = {}, index, size }) {
    return await User.find(filter).sort(sort).skip(index).limit(size).lean();
  },
};

module.exports = UserService;
