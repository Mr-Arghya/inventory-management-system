const CommonLib = {
  getPagination(page, limit, total) {
    const pagination = {
      currentPage: page,
      lastPage: 0,
      total: 0,
      showing: limit,
    };

    pagination.lastPage = Math.ceil(total / limit);
    pagination.total = total;
    return pagination;
  },
  paginateArray(dataArray, pageNumber, itemsPerPage) {
    const startIndex = (pageNumber - 1) * itemsPerPage;
    const paginatedData = dataArray.slice(
      startIndex,
      startIndex + itemsPerPage
    );
    return paginatedData;
  },
};

module.exports = CommonLib;
