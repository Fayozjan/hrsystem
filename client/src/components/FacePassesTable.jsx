import { useState } from "react";

import Badge from "./Badge";
import SortArrow from "./SortArrow";
import EmployeeCell from "./EmployeeCell";

import styles from "./FacePassesTable.module.scss";
import { t } from "i18next";
import { formatIsoToLocalDateTime } from "../utils/date";

const DEFAULT_VISIBLE = { location: false, source: false };

const TableHrEvents = ({
  data,
  currentPage,
  pageSize,
  visibleColumns = DEFAULT_VISIBLE,
}) => {
  const [sortField, setSortField] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  const getSortedData = () => {
    return [...data].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (sortField === "event_time_formatted") {
        const aDate = new Date(aVal);
        const bDate = new Date(bVal);
        if (!isNaN(aDate) && !isNaN(bDate)) {
          return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
        }
      }

      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortOrder === "asc" ? aNum - bNum : bNum - aNum;
      }

      return sortOrder === "asc"
        ? String(aVal).localeCompare(String(bVal), "ru", { sensitivity: "base" })
        : String(bVal).localeCompare(String(aVal), "ru", { sensitivity: "base" });
    });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const extraCols =
    (visibleColumns.source ? 1 : 0) + (visibleColumns.location ? 1 : 0);

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>№</th>
            <th
              className={styles.table_name_header}
              onClick={() => handleSort("name")}
            >
              <span className={styles.headerContent}>
                {t("employee")}
                <SortArrow active={sortField === "name"} order={sortOrder} />
              </span>
            </th>
            <th onClick={() => handleSort("position_name")}>
              <span className={styles.headerContent}>
                {t("position")}
                <SortArrow
                  active={sortField === "position_name"}
                  order={sortOrder}
                />
              </span>
            </th>
            <th onClick={() => handleSort("door_name")}>
              <span className={styles.headerContent}>
                {t("door")}
                <SortArrow
                  active={sortField === "door_name"}
                  order={sortOrder}
                />
              </span>
            </th>
            {visibleColumns.source && (
              <th onClick={() => handleSort("source")}>
                <span className={styles.headerContent}>
                  {t("source")}
                  <SortArrow
                    active={sortField === "source"}
                    order={sortOrder}
                  />
                </span>
              </th>
            )}
            {visibleColumns.location && <th>{t("location")}</th>}
            <th onClick={() => handleSort("event_type")}>
              <span className={styles.headerContent}>
                {t("direction")}
                <SortArrow
                  active={sortField === "event_type"}
                  order={sortOrder}
                />
              </span>
            </th>
            <th onClick={() => handleSort("date")}>
              <span className={styles.headerContent}>
                {t("time")}
                <SortArrow active={sortField === "date"} order={sortOrder} />
              </span>
            </th>
            <th>{t("image")}</th>
          </tr>
        </thead>
        <tbody>
          {data?.length > 0 ? (
            getSortedData().map((event, i) => {
              const emp = event?.employee;
              return (
                <tr key={event.identifier}>
                  <td>{(currentPage - 1) * pageSize + i + 1}</td>
                  <td>
                    <EmployeeCell
                      photo={emp?.photo}
                      lastName={emp?.last_name}
                      firstName={emp?.first_name}
                      middleName={emp?.middle_name}
                      id={event?.employee_id}
                      branch={emp?.branch?.name}
                      department={emp?.department?.name}
                      active={emp?.status !== false}
                    />
                  </td>
                  <td>{emp?.position?.name}</td>
                  <td>{event?.door?.name ?? "—"}</td>
                  {visibleColumns.source && <td>{t(event?.source)}</td>}
                  {visibleColumns.location && (
                    <td>
                      {event?.latitude != null && event?.longitude != null ? (
                        <a
                          href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {event.latitude.toFixed(5)},{" "}
                          {event.longitude.toFixed(5)}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  )}
                  <td>
                    <Badge text={event?.direction} />
                  </td>
                  <td>{formatIsoToLocalDateTime(event.date)}</td>
                  <td>
                    {event.photo && (
                      <img
                        src={`/api/face-passes/image/${event.photo}`}
                        className={styles.cameraPhoto}
                      />
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={7 + extraCols}>{t("noData")}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TableHrEvents;
