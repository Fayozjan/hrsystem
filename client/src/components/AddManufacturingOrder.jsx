import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useAuthStore } from "../stores/authStore";
import { useAlertStore } from "../stores/alertStore";

import Button from "./Button";
import styles from "./AddManufacturingOrder.module.scss";
import { addManufacturingOrder } from "../api";
import { Icons } from "../icons/icons";

const AddManufacturingOrder = ({ cancelButton }) => {
  const [formData, setFormData] = useState({
    // Производственный заказ
    receiveDate: "",
    deadline: "",
    client: "",
    branch: "",
    orderNumber: "",
    orderId: "",
    description: "",
    manager: "",
    status: "В обработке",

    // Продукт
    productName: "",
    fabric: "",
    design: "",
    designVariant: "",
    color: "",
    colorVariant: "",
    unit: "",
    quantity: 0,
    gram: "",
    grammage: "",
    price: 0,
    total: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const { showAlert } = useAlertStore();
  const userSettings = useAuthStore((state) => state.userSettings);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (userSettings?.language) {
      i18n.changeLanguage(userSettings.language);
    }
  }, [userSettings, i18n]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      let updated = { ...prev, [name]: value };

      // Автоматический расчет суммы
      if (name === "quantity" || name === "price") {
        const qty = name === "quantity" ? +value : +updated.quantity;
        const pr = name === "price" ? +value : +updated.price;
        updated.total = qty * pr;
      }

      return updated;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        const res = await addManufacturingOrder({ ...formData });

        if (res.success) {
          showAlert(t("orderAdded"), "success");
          setTimeout(() => cancelButton(), 1500);
        } else {
          console.error("Ошибка в ответе сервера:", res.data);
          showAlert(t("errorAddOrder"), "error");
        }
      } catch (error) {
        console.error("Ошибка при отправке данных:", error);
        showAlert(t("errorAddOrder"), "error");
      } finally {
        setIsLoading(false);
      }
    },
    [formData]
  );

  return (
    <div className={styles.overlay}>
      <div className={styles.add_order}>
        <h1>{t("addManufacturingOrder")}</h1>
        <span className={styles.cancelBtn} onClick={() => cancelButton()} style={{ display: "flex", cursor: "pointer" }}>{Icons.clear}</span>

        <div className={styles.container}>
          <form className={styles.orderForm} onSubmit={handleSubmit}>
            <h2>{t("productionOrder")}</h2>
            <div className={styles.formGroup}>
              <label>{t("receivedDate")}</label>
              <input
                type="date"
                name="receiveDate"
                value={formData.receiveDate}
                onChange={handleChange}
                required
              />

              <label>{t("deadline")}</label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                required
              />

              <label>{t("client")}</label>
              <input
                type="text"
                name="client"
                value={formData.client}
                onChange={handleChange}
                required
              />

              <label>{t("branch")}</label>
              <input
                type="text"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                required
              />

              <label>{t("mfgOrderNumber")}</label>
              <input
                type="text"
                name="orderNumber"
                value={formData.orderNumber}
                onChange={handleChange}
              />

              <label>{t("mfgOrderId")}</label>
              <input
                type="text"
                name="orderId"
                value={formData.orderId}
                onChange={handleChange}
              />

              <label>{t("note")}</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
              ></textarea>

              <label>{t("manager")}</label>
              <input
                type="text"
                name="manager"
                value={formData.manager}
                onChange={handleChange}
              />

              <label>{t("status")}</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="В обработке">{t("inProcess")}</option>
                <option value="Выполнен">{t("completed")}</option>
                <option value="Отменен">{t("cancelled")}</option>
              </select>
            </div>

            <h2>{t("product")}</h2>
            <div className={styles.formGroup}>
              <label>{t("productName")}</label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                required
              />

              <label>{t("fabric")}</label>
              <input
                type="text"
                name="fabric"
                value={formData.fabric}
                onChange={handleChange}
              />

              <label>{t("design")}</label>
              <input
                type="text"
                name="design"
                value={formData.design}
                onChange={handleChange}
              />

              <label>{t("designVariant")}</label>
              <input
                type="text"
                name="designVariant"
                value={formData.designVariant}
                onChange={handleChange}
              />

              <label>{t("color")}</label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
              />

              <label>{t("colorVariant")}</label>
              <input
                type="text"
                name="colorVariant"
                value={formData.colorVariant}
                onChange={handleChange}
              />

              <label>{t("unitOfMeasure")}</label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
              />

              <label>{t("quantity")}</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
              />

              <label>{t("price")}</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
              />

              <label>{t("totalAmount")}</label>
              <input
                type="number"
                name="total"
                value={formData.total}
                readOnly
              />

              <label>{t("grams")}</label>
              <input
                type="number"
                name="gram"
                value={formData.gram}
                onChange={handleChange}
              />

              <label>{t("grammage")}</label>
              <input
                type="text"
                name="grammage"
                value={formData.grammage}
                onChange={handleChange}
              />
            </div>

            <div className={styles.buttons}>
              <Button text={t("save")} type="submit" disabled={isLoading} />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddManufacturingOrder;
