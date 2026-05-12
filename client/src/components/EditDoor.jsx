import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useAuthStore } from "../stores/authStore";
import { useAlertStore } from "../stores/alertStore";

import { getDoor, editDoor } from "../api";
import { getActiveBranches } from "../api/branches";
import { EmployeeService } from "../api/employees";

import Button from "./Button";

import styles from "./AddDoor.module.scss";

const EditDoors = ({ id, handleClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    status: "",
    branch_id: "",
    latitude: "",
    longitude: "",
  });
  const [branches, setBranches] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [empSearch, setEmpSearch] = useState("");
  const userSettings = useAuthStore((state) => state.userSettings);
  const { i18n, t } = useTranslation();
  const { showAlert } = useAlertStore();

  useEffect(() => {
    if (userSettings?.language) i18n.changeLanguage(userSettings.language);
  }, []);

  useEffect(() => {
    getActiveBranches()
      .then((res) => { if (res.success) setBranches(res.data); })
      .catch(() => {});
    EmployeeService.getActive()
      .then((res) => { if (res.success) setAllEmployees(res.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getDoor(id);
        if (res.success) {
          setFormData({
            name: res.data.name ?? "",
            status: res.data.status !== undefined ? String(res.data.status) : "true",
            branch_id: res.data.branch_id ?? "",
            latitude: res.data.latitude ?? "",
            longitude: res.data.longitude ?? "",
          });
          if (Array.isArray(res.data.employees)) {
            setSelectedIds(res.data.employees.map((e) => Number(e.id)));
          }
        } else {
          console.error("Ошибка при получении данных двери");
        }
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error.message);
        showAlert(t("error"), "error");
        setTimeout(handleClose, 1500);
      }
    };
    fetchData();
  }, []);

  const filteredEmployees = useMemo(() => {
    const q = empSearch.trim().toLowerCase();
    if (!q) return allEmployees;
    return allEmployees.filter((e) => {
      const fullName = (e.employeeFullName || "").toLowerCase();
      const num = String(e.employeeNumber ?? "").toLowerCase();
      const empId = String(e.id);
      return fullName.includes(q) || num.includes(q) || empId.includes(q);
    });
  }, [allEmployees, empSearch]);

  const allFilteredSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((e) => selectedIds.includes(Number(e.id)));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleEmployee = (empId) => {
    const numId = Number(empId);
    setSelectedIds((prev) =>
      prev.includes(numId) ? prev.filter((x) => x !== numId) : [...prev, numId]
    );
  };

  const toggleSelectAll = () => {
    const filteredNumIds = filteredEmployees.map((e) => Number(e.id));
    if (allFilteredSelected) {
      setSelectedIds((prev) => prev.filter((x) => !filteredNumIds.includes(x)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...filteredNumIds])]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await editDoor(id, { ...formData, employee_ids: selectedIds });
      if (res.success) {
        showAlert(t("success"), "success");
        onSuccess();
        setTimeout(handleClose, 1000);
      }
    } catch (error) {
      console.error("Ошибка при отправке данных:", error.response ? error.response.data : error.message);
      showAlert(t("error"), "error");
    }
  };

  return (
    <form className={styles.addDoor} onSubmit={handleSubmit}>
      <div className={styles.header}>
        <h2>{t("editDoor")}</h2>
        <Button text={t("save")} type={"submit"} />
      </div>

      <div className={styles.row}>
        <div>
          <label htmlFor="name">{t("name")}</label>
          <input
            type="text"
            name="name"
            value={formData?.name}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className={styles.row}>
        <div>
          <label htmlFor="branch_id">{t("branch")}</label>
          <select name="branch_id" value={formData?.branch_id} onChange={handleChange}>
            <option value="">{t("notSelected")}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.row}>
        <div>
          <label htmlFor="latitude">{t("latitude")}</label>
          <input
            type="number"
            name="latitude"
            step="any"
            value={formData?.latitude}
            onChange={handleChange}
            placeholder="например: 41.299496"
          />
        </div>
        <div>
          <label htmlFor="longitude">{t("longitude")}</label>
          <input
            type="number"
            name="longitude"
            step="any"
            value={formData?.longitude}
            onChange={handleChange}
            placeholder="например: 69.240073"
          />
        </div>
      </div>

      <div className={styles.row}>
        <div>
          <label>{t("status")}</label>
          <select name="status" value={formData?.status} onChange={handleChange}>
            <option value="true">{t("enable")}</option>
            <option value="false">{t("disable")}</option>
          </select>
        </div>
      </div>

      <div className={styles.employeePicker}>
        <div className={styles.employeePickerHeader}>
          <span className={styles.employeePickerLabel}>
            {t("employees")}
            {selectedIds.length > 0 && (
              <span className={styles.selectedCount}>{selectedIds.length}</span>
            )}
          </span>
          <button type="button" className={styles.selectAllBtn} onClick={toggleSelectAll}>
            {allFilteredSelected ? t("deselectAll") : t("selectAll")}
          </button>
        </div>
        <input
          className={styles.employeeSearch}
          type="text"
          placeholder={t("search")}
          value={empSearch}
          onChange={(e) => setEmpSearch(e.target.value)}
        />
        <div className={styles.employeeList}>
          {filteredEmployees.map((emp) => {
            const numId = Number(emp.id);
            const checked = selectedIds.includes(numId);
            return (
              <label key={emp.id} className={`${styles.employeeItem} ${checked ? styles.checked : ""}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleEmployee(emp.id)}
                />
                <span className={styles.empName}>{emp.employeeFullName}</span>
                {emp.employeeNumber && (
                  <span className={styles.empNum}>{emp.employeeNumber}</span>
                )}
              </label>
            );
          })}
          {filteredEmployees.length === 0 && (
            <div className={styles.noEmployees}>{t("noData")}</div>
          )}
        </div>
      </div>
    </form>
  );
};

export default EditDoors;
