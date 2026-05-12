import { DoorModel } from "./doors.model.js";
import { FaceDeviceClient, RemoteFaceDeviceClient } from "../../utils/faceDeviceFunction.js";

export const DoorsService = {
  getDoors: async ({ page, pageSize, filters = {} }) => {
    const currentPage = Math.max(parseInt(page || 1), 1);
    const limit = Math.max(parseInt(pageSize || 50), 1);
    const skip = (currentPage - 1) * limit;

    const where = {};
    if (filters.search)
      where.name = { contains: filters.search, mode: "insensitive" };
    if (filters.status !== undefined && filters.status !== "")
      where.status = filters.status === "true";
    if (filters.branch_id)
      where.branch_id = Number(filters.branch_id);

    const [doors, total] = await Promise.all([
      DoorModel.findMany({ where, skip, take: limit }),
      DoorModel.count(where),
    ]);

    const formatted = doors.map((d) => ({
      ...d,
      employees_count: d._count.employees,
    }));

    return {
      data: formatted,
      pagination: {
        totalItems: total,
        currentPage,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  getActiveDoors: async () => {
    return DoorModel.findActive();
  },

  getDoorById: async (id) => {
    return DoorModel.findUnique(id);
  },

  createDoor: async ({ name, status = true, branch_id, latitude, longitude, employee_ids }) => {
    const data = {
      name,
      status,
      branch_id: branch_id ? Number(branch_id) : null,
      latitude: latitude !== undefined && latitude !== "" ? parseFloat(latitude) : null,
      longitude: longitude !== undefined && longitude !== "" ? parseFloat(longitude) : null,
    };
    if (Array.isArray(employee_ids) && employee_ids.length > 0) {
      data.employees = { connect: employee_ids.map((id) => ({ id: Number(id) })) };
    }
    return DoorModel.create(data);
  },

  _syncDoorData: async (door, tenantSchema) => {
    const results = { success: 0, failed: 0, errors: [] };

    for (const device of door.faceDevices) {
      for (const employee of door.employees) {
        const employeeNo = String(employee.id);
        const fullName = `${employee.last_name ?? ""} ${employee.first_name ?? ""}`.trim();
        const fired = employee.status === false;

        try {
          if (device.is_local) {
            if (fired) {
              // Удаляем строго по ID сотрудника
              await FaceDeviceClient.deleteUser(device.device_ip, employeeNo);
            } else {
              await FaceDeviceClient.updateUser(device.device_ip, employeeNo, fullName);
              if (employee.photo) {
                await FaceDeviceClient.updateUserPhoto(device.device_ip, employeeNo, fullName, employee.photo);
              }
            }
          } else if (device.serial_number) {
            if (fired) {
              // Удаляем строго по ID сотрудника
              await RemoteFaceDeviceClient.deleteUserFromDevice(employeeNo, device.serial_number);
            } else {
              await RemoteFaceDeviceClient.addUserToDevice(employeeNo, fullName, device.serial_number);
              if (employee.photo) {
                await RemoteFaceDeviceClient.addUserPhotoToDevice(
                  employeeNo,
                  fullName,
                  device.serial_number,
                  employee.photo,
                  tenantSchema,
                );
              }
            }
          }
          results.success++;
        } catch (err) {
          results.failed++;
          results.errors.push({ employeeId: employee.id, deviceId: device.id, error: err.message });
        }
      }
    }

    return results;
  },

  syncDoor: async (doorId, tenantSchema) => {
    const door = await DoorModel.findWithDevicesAndEmployees(doorId);
    if (!door) throw new Error("Door not found");
    return DoorsService._syncDoorData(door, tenantSchema);
  },

  syncAllDoors: async (tenantSchema) => {
    const doors = await DoorModel.findAllActiveWithDevicesAndEmployees();
    const results = { success: 0, failed: 0, errors: [] };

    for (const door of doors) {
      try {
        const r = await DoorsService._syncDoorData(door, tenantSchema);
        results.success += r.success;
        results.failed += r.failed;
        results.errors.push(...r.errors);
      } catch (err) {
        results.failed++;
        results.errors.push({ doorId: door.id, error: err.message });
      }
    }

    return results;
  },

  updateDoor: async (id, { name, status, branch_id, latitude, longitude, employee_ids }) => {
    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (status !== undefined) data.status = status === "true" || status === true;
    if (branch_id !== undefined) data.branch_id = branch_id ? Number(branch_id) : null;
    if (latitude !== undefined) data.latitude = latitude !== "" ? parseFloat(latitude) : null;
    if (longitude !== undefined) data.longitude = longitude !== "" ? parseFloat(longitude) : null;
    if (Array.isArray(employee_ids)) {
      data.employees = { set: employee_ids.map((id) => ({ id: Number(id) })) };
    }
    return DoorModel.update(id, data);
  },
};
