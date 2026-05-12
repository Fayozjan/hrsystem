import { useState, useRef, useEffect } from "react";
import EmployeeFilterForm from "./EmployeeFilterForm";
import { Icons } from "../icons/icons";
import styles from "./DepartmentFilter.module.scss";

const DepartmentFilter = ({ formData, setFormData, onSubmit, t }) => {
  const [isOpen, setIsOpen] = useState(false);

  const initialFormData = {
    branch_id: "",
    status: "",
  };

  const activeCount = Object.entries(formData).filter(
    ([key, value]) => key !== "search" && value !== "",
  ).length;

  const wrapperRef = useRef(null);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  const handleReset = () => {
    setFormData(initialFormData);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleEsc = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    const handleScroll = () => {
      setIsOpen(false);
    };

    document.addEventListener("pointerdown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    document.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
      document.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen]);

  return (
    <div ref={wrapperRef} className={styles.filterToggle}>
      <div
        className={`${styles.toggleBtn} + ${activeCount ? styles.active : ""}`}
        onClick={toggleOpen}
      >
        {Icons.filter}
        {activeCount > 0 && <span className={styles.badge}>{activeCount}</span>}
      </div>

      {isOpen && (
        <div className={styles.filterContent}>
          <form onSubmit={onSubmit}>
            <EmployeeFilterForm
              filters={["branch"]}
              formData={formData}
              setFormData={setFormData}
            />

            <div>
              <h2>{t("status")}</h2>
              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name=""
                    value=""
                    checked={formData.status === ""}
                    onChange={() =>
                      setFormData((prev) => ({ ...prev, status: "" }))
                    }
                  />
                  {t("all")}
                </label>

                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="status"
                    value="true"
                    checked={formData.status === "true"}
                    onChange={() =>
                      setFormData((prev) => ({ ...prev, status: "true" }))
                    }
                  />
                  {t("true")}
                </label>

                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="status"
                    value="false"
                    checked={formData.status === "false"}
                    onChange={() =>
                      setFormData((prev) => ({ ...prev, status: "false" }))
                    }
                  />
                  {t("false")}
                </label>
              </div>
            </div>

            <div className={styles.actions}>
              <button type="button" onClick={handleReset}>
                {t("clearAll")}
              </button>
              <button type="submit">{t("apply")}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DepartmentFilter;
