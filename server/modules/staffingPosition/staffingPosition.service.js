import { StaffingPositionModel } from "./staffingPosition.model.js";

export const StaffingPositionService = {
  getByDepartment: async (departmentId) => {
    return StaffingPositionModel.findByDepartment(departmentId);
  },

  bulkUpsert: async (departmentId, positions = []) => {
    return StaffingPositionModel.bulkUpsert(departmentId, positions);
  },
};
