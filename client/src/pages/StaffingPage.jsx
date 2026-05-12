import { useState, useEffect, useMemo } from "react";
import { Users, UserCheck, UserX, Briefcase, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { getDepartmentsStaffingOverview } from "../api/departments";
import { getStaffingPositions } from "../api/staffingPosition";
import { useAlertStore } from "../stores/alertStore";
import { exportStaffingToExcel } from "../utils/DocGenerator";

import Loading from "../components/Loading";
import Pagination from "../components/Pagination";
import DownloadButton from "../components/DownloadButton";
import StaffingFilter from "../components/StaffingFilter";
import VacanciesModal from "../components/VacanciesModal";
import { Icons } from "../icons/icons";

import styles from "./StaffingPage.module.scss";

const StaffingPage = () => {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [detailData, setDetailData] = useState({});
  const [detailLoading, setDetailLoading] = useState({});

  const [search, setSearch] = useState("");
  const [filterData, setFilterData] = useState({ branch_id: "", department_id: "" });
  const [filterHasStaff, setFilterHasStaff] = useState(false);
  const [filterHasVacancies, setFilterHasVacancies] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [vacanciesModalOpen, setVacanciesModalOpen] = useState(false);

  const { showAlert } = useAlertStore();

  const fetchData = async (params = filterData) => {
    setLoading(true);
    try {
      const query = {};
      if (params.branch_id) query.branch_id = params.branch_id;
      if (params.department_id) query.department_id = params.department_id;
      const res = await getDepartmentsStaffingOverview(query);
      setData(res.data || []);
    } catch {
      showAlert(t("staffingLoadError"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setExpandedId(null);
  }, [search, filterHasStaff, filterHasVacancies]);

  const filteredData = useMemo(() => {
    let result = data;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          (d.branch_name || "").toLowerCase().includes(q) ||
          (d.name || "").toLowerCase().includes(q),
      );
    }
    if (filterHasStaff) result = result.filter((d) => (d.planned || 0) > 0);
    if (filterHasVacancies) result = result.filter((d) => (d.vacancies || 0) > 0);
    return result;
  }, [data, search, filterHasStaff, filterHasVacancies]);

  const totalPlanned = filteredData.reduce((s, d) => s + (d.planned || 0), 0);
  const totalActual = filteredData.reduce((s, d) => s + (d.actual || 0), 0);
  const totalVacancies = filteredData.reduce((s, d) => s + (d.vacancies || 0), 0);
  const totalNonStaffed = filteredData.reduce((s, d) => s + (d.non_staffed || 0), 0);
  const totalStaffedActual = totalActual - totalNonStaffed;

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleRowClick = async (deptId) => {
    if (expandedId === deptId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(deptId);
    if (detailData[deptId]) return;

    setDetailLoading((prev) => ({ ...prev, [deptId]: true }));
    try {
      const res = await getStaffingPositions(deptId);
      setDetailData((prev) => ({ ...prev, [deptId]: res.data || [] }));
    } catch {
      showAlert(t("staffingPositionsLoadError"), "error");
    } finally {
      setDetailLoading((prev) => ({ ...prev, [deptId]: false }));
    }
  };

  const handleFilterSubmit = () => {
    setCurrentPage(1);
    setExpandedId(null);
    fetchData(filterData);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    setExpandedId(null);
  };

  const handleChangePageSize = (e) => {
    setPageSize(parseInt(e.target.value, 10));
    setCurrentPage(1);
    setExpandedId(null);
  };

  return (
    <div className={styles.staffingPage}>
      <VacanciesModal
        isOpen={vacanciesModalOpen}
        onClose={() => setVacanciesModalOpen(false)}
        departments={filteredData}
      />
      {loading ? (
        <Loading />
      ) : (
        <div className={styles.main}>
          {data.length > 0 && (
            <div className={styles.statsGrid}>
              <StatWidget
                icon={Users}
                color="#6366f1"
                label={t("staffingPlan")}
                value={totalPlanned}
                progress={totalPlanned > 0 ? (totalStaffedActual / totalPlanned) * 100 : 0}
              />
              <StatWidget icon={UserCheck} color="#10b981" label={t("statsTotal")} value={totalActual} />
              <StatWidget icon={UserX} color="#ef4444" label={t("nonStaffed")} value={totalNonStaffed} />
              <StatWidget icon={CheckCircle2} color="#3b82f6" label={t("inStaff")} value={totalStaffedActual} />
              <StatWidget
                icon={Briefcase}
                color="#f59e0b"
                label={t("vacancies")}
                value={totalVacancies}
                onClick={() => setVacanciesModalOpen(true)}
              />
            </div>
          )}

          <div className={styles.mainHeader}>
            <div className={styles.filterWrapper}>
              <div className={styles.searchInput}>
                <span>{Icons.search}</span>
                <input
                  type="text"
                  placeholder={t("searchByBranchDept")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <span className={styles.clearBtn} onClick={() => setSearch("")}>
                    {Icons.clear}
                  </span>
                )}
              </div>

              <StaffingFilter
                formData={filterData}
                setFormData={setFilterData}
                onSubmit={handleFilterSubmit}
              />

              <button
                className={`${styles.chipFilter} ${filterHasStaff ? styles.chipActive : ""}`}
                style={{ "--chip-color": "#6366f1" }}
                onClick={() => setFilterHasStaff((v) => !v)}
              >
                <Users size={12} />
                {t("hasStaff")}
              </button>

              <button
                className={`${styles.chipFilter} ${filterHasVacancies ? styles.chipActive : ""}`}
                style={{ "--chip-color": "#f59e0b" }}
                onClick={() => setFilterHasVacancies((v) => !v)}
              >
                <Briefcase size={12} />
                {t("hasVacancies")}
              </button>
            </div>

            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={filteredData.length}
              totalPages={totalPages}
              handleChangePageSize={handleChangePageSize}
              handlePageChange={handlePageChange}
            />

            <div className={styles.buttonsWrapper}>
              <div className={styles.refreshBtn} onClick={() => fetchData()}>
                {Icons.refresh}
              </div>
              {filteredData.length > 0 && (
                <DownloadButton onClick={() => exportStaffingToExcel(filteredData)} />
              )}
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>№</th>
                  <th style={{ textAlign: "left" }}>{t("department")}</th>
                  <th style={{ textAlign: "left" }}>{t("branchSection")}</th>
                  <th>{t("staffingPlan")}</th>
                  <th>{t("statsTotal")}</th>
                  <th>{t("nonStaffed")}</th>
                  <th>{t("inStaff")}</th>
                  <th>{t("vacancies")}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((dept, i) => (
                    <>
                      <tr
                        key={dept.id}
                        onClick={() => handleRowClick(dept.id)}
                        style={{
                          cursor: "pointer",
                          background:
                            expandedId === dept.id ? "var(--hover-bg, #f8fafc)" : undefined,
                        }}
                      >
                        <td>{(currentPage - 1) * pageSize + i + 1}</td>
                        <td
                          style={{
                            textAlign: "left",
                            fontWeight: expandedId === dept.id ? 600 : undefined,
                          }}
                        >
                          <span style={{ marginRight: 6, fontSize: 11, color: "#94a3b8" }}>
                            {expandedId === dept.id ? "▼" : "▶"}
                          </span>
                          {dept.name}
                        </td>
                        <td style={{ textAlign: "left", color: "var(--text-secondary)" }}>
                          {dept.branch_name}
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: "#6366f1" }}>{dept.planned}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: "#10b981" }}>{dept.actual}</span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontWeight: 600,
                              color: dept.non_staffed > 0 ? "#ef4444" : "#94a3b8",
                            }}
                          >
                            {dept.non_staffed || 0}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: "#3b82f6" }}>
                            {(dept.actual || 0) - (dept.non_staffed || 0)}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontWeight: 600,
                              color: dept.vacancies > 0 ? "#f59e0b" : "#94a3b8",
                            }}
                          >
                            {dept.vacancies}
                          </span>
                        </td>
                      </tr>

                      {expandedId === dept.id && (
                        <tr key={`detail-${dept.id}`}>
                          <td colSpan={8} style={{ padding: 0, background: "#f8fafc" }}>
                            <DetailPanel
                              loading={detailLoading[dept.id]}
                              positions={detailData[dept.id]}
                            />
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8}>{t("noData")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const StatWidget = ({ icon: Icon, color, label, value, progress, onClick }) => (
  <div
    className={styles.statWidget}
    onClick={onClick}
    style={onClick ? { cursor: "pointer" } : undefined}
  >
    <div className={styles.statWidgetInner}>
      <div className={styles.statWidgetIcon} style={{ background: color + "18" }}>
        <Icon size={15} color={color} strokeWidth={2} />
      </div>
      <div className={styles.statWidgetContent}>
        <span className={styles.statWidgetLabel}>{label}</span>
        <span className={styles.statWidgetValue} style={{ color }}>{value}</span>
      </div>
    </div>
    {progress != null && (
      <div className={styles.statWidgetProgressTrack}>
        <div
          className={styles.statWidgetProgressFill}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%`, background: color }}
        />
      </div>
    )}
  </div>
);

const DetailPanel = ({ loading, positions }) => {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div style={{ padding: "10px 32px", fontSize: 13, color: "#94a3b8" }}>
        {t("loading")}
      </div>
    );
  }
  if (!positions || positions.length === 0) {
    return (
      <div style={{ padding: "10px 32px", fontSize: 13, color: "#94a3b8" }}>
        {t("noPositionsAssigned")}
      </div>
    );
  }
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
      <thead>
        <tr style={{ background: "#f1f5f9" }}>
          <th style={{ padding: "5px 32px", textAlign: "left", fontWeight: 600, color: "#64748b" }}>
            {t("position")}
          </th>
          <th style={{ padding: "5px 12px", textAlign: "center", fontWeight: 600, color: "#6366f1", width: 110 }}>
            {t("staffingPlan")}
          </th>
          <th style={{ padding: "5px 12px", textAlign: "center", fontWeight: 600, color: "#10b981", width: 80 }}>
            {t("statsTotal")}
          </th>
          <th style={{ padding: "5px 12px", textAlign: "center", fontWeight: 600, color: "#ef4444", width: 110 }}>
            {t("nonStaffed")}
          </th>
          <th style={{ padding: "5px 12px", textAlign: "center", fontWeight: 600, color: "#3b82f6", width: 90 }}>
            {t("inStaff")}
          </th>
          <th style={{ padding: "5px 12px", textAlign: "center", fontWeight: 600, color: "#f59e0b", width: 100 }}>
            {t("vacancies")}
          </th>
        </tr>
      </thead>
      <tbody>
        {positions.map((p, i) => (
          <tr
            key={p.position_id ?? `extra-${i}`}
            style={{
              borderBottom: "1px solid #e2e8f0",
              background: p.is_extra ? "#fff7f7" : undefined,
            }}
          >
            <td style={{ padding: "5px 32px", textAlign: "left" }}>
              {p.is_extra && (
                <span style={{ fontSize: 10, color: "#ef4444", marginRight: 6, fontWeight: 600 }}>
                  {t("nonStaffedBadge")}
                </span>
              )}
              {p.position_name}
            </td>
            <td style={{ padding: "5px 12px", textAlign: "center", fontWeight: 600, color: "#6366f1" }}>
              {Number(p.headcount)}
            </td>
            <td style={{ padding: "5px 12px", textAlign: "center", fontWeight: 600, color: "#10b981" }}>
              {Number(p.actual)}
            </td>
            <td
              style={{
                padding: "5px 12px",
                textAlign: "center",
                fontWeight: 600,
                color: Number(p.non_staffed) > 0 ? "#ef4444" : "#94a3b8",
              }}
            >
              {Number(p.non_staffed)}
            </td>
            <td style={{ padding: "5px 12px", textAlign: "center", fontWeight: 600, color: "#3b82f6" }}>
              {Number(p.actual) - Number(p.non_staffed)}
            </td>
            <td
              style={{
                padding: "5px 12px",
                textAlign: "center",
                fontWeight: 600,
                color: Number(p.vacancies) > 0 ? "#f59e0b" : "#94a3b8",
              }}
            >
              {Number(p.vacancies)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default StaffingPage;
