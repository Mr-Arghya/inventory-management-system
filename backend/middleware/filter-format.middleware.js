const { Types } = require("mongoose");

const formatter = {
  async formatFilter(req, res, next) {
    try {
      const query = req.query;
      let filterParam = {};

      try {
        filterParam = query?.filter ? JSON.parse(query.filter) : {};
      } catch (parseError) {
        return res.status(400).json({
          error: "Invalid filter format. Must be valid JSON.",
        });
      }

      if (Object.keys(filterParam).length === 0) {
        req.filter = {};
        return next();
      }

      const formattedFilter = {};

      Object.keys(filterParam).forEach((field) => {
        const filterValue = filterParam[field];
        if (
          filterValue === null ||
          filterValue === undefined ||
          (typeof filterValue === "string" && filterValue.trim() === "")
        ) {
          return;
        }

        if (typeof filterValue === "object" && filterValue !== null) {
          const operators = {};
          let hasValidOperators = false;

          Object.keys(filterValue).forEach((op) => {
            let value = filterValue[op];
            if (
              value === null ||
              value === undefined ||
              (typeof value === "string" && value.trim() === "")
            ) {
              return;
            }

            if (Types.ObjectId.isValid(value)) {
              value = new Types.ObjectId(value);
            }
            operators[op] = value;
            hasValidOperators = true;
          });
          if (hasValidOperators) {
            formattedFilter[field] = operators;
          }
        } else {
          if (Types.ObjectId.isValid(filterValue)) {
            formattedFilter[field] = new Types.ObjectId(filterValue);
          } else if (typeof filterValue === "string" && filterValue.trim()) {
            formattedFilter[field] = new RegExp(filterValue.trim(), "i");
          } else {
            formattedFilter[field] = filterValue;
          }
        }
      });

      req.filter = formattedFilter;
      next();
    } catch (error) {
      next(error);
    }
  },

  async formatPageAndSize(req, res, next) {
    try {
      const query = req.query;
      const page =
        query.page && query.page !== "undefined" ? parseInt(query.page) : 1;
      const size =
        query.size && query.size !== "undefined" ? parseInt(query.size) : 10;
      req.query.page = page;
      req.query.size = size;
      next();
    } catch (error) {
      next(error);
    }
  },
};

module.exports = formatter;
