import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Input } from "../../shared/ui";
import styles from "./ContactPage.module.css";

export const ContactPage = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Contact form submitted:", formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className={styles.contactPage}>
      <h1>{t("contact.title")}</h1>

      <div className={styles.contactContent}>
        <div className={styles.formSection}>
          <h2>{t("contact.sendMessage")}</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              label={t("contact.name")}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <Input
              label={t("contact.email")}
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
            <div className={styles.textareaWrapper}>
              <label>{t("contact.message")}</label>
              <textarea
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                required
              />
            </div>
            <Button type="submit" variant="primary">
              {t("contact.send")}
            </Button>
            {submitted && (
              <p className={styles.success}>{t("contact.success")}</p>
            )}
          </form>
        </div>

        <div className={styles.infoSection}>
          <h2>{t("contact.contactInfo")}</h2>
          <ul>
            <li>support@mymyshop.com</li>
            <li>+1 (555) 123-4567</li>
            <li>111111, г.Москва, ул. Примерная, д. 1</li>
          </ul>
          <div className={styles.workHours}>
            <h3>{t("contact.workHours")}</h3>
            <p>{t("contact.monFri")}</p>
            <p>{t("contact.sat")}</p>
            <p>{t("contact.sun")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
