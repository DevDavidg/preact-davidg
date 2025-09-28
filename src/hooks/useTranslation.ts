import { useState, useEffect } from "preact/hooks";
import { i18n, useTranslation as useI18n } from "../utils/i18n";

export const useTranslation = () => {
  const [locale, setLocaleState] = useState(i18n.getLocale());

  useEffect(() => {
    const handleLocaleChange = (event: CustomEvent) => {
      setLocaleState(event.detail.locale);
    };

    window.addEventListener(
      "localeChanged",
      handleLocaleChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "localeChanged",
        handleLocaleChange as EventListener
      );
    };
  }, []);

  const setLocale = (newLocale: string) => {
    i18n.setLocale(newLocale as any);
  };

  return {
    t: i18n.t.bind(i18n),
    locale,
    setLocale,
    translations: i18n.getTranslations(),
  };
};

export default useTranslation;
