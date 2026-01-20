const { sendResponse } = require("../lib/response.lib");
const { DashboardService } = require("../services");

const DashboardController = {
  async getDashboard(req, res) {
    try {
      const user = req.user;
      const tenantId = user.owner_id;

      if (!tenantId) {
        return sendResponse(
          res,
          400,
          { message: "Tenant ID not found in user context" },
          true,
        );
      }

      const dashboardData = await DashboardService.getDashboardData(tenantId);

      return sendResponse(
        res,
        200,
        "Dashboard data fetched successfully",
        dashboardData,
        false,
      );
    } catch (error) {
      console.error("Dashboard Error:", error);
      return sendResponse(res, 500, { message: error.message }, true);
    }
  },
};

module.exports = DashboardController;
