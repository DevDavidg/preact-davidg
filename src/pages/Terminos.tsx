import { FunctionComponent } from "preact";
import { useTranslation } from "../hooks/useTranslation";

const Terminos: FunctionComponent<{ path?: string }> = () => {
  const { t } = useTranslation();

  return (
    <div class="min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <article class="max-w-3xl mx-auto">
        <h1 class="text-3xl font-bold mb-8 text-light-primary dark:text-dark-primary">{t("terms.title")}</h1>
        <p class="text-light-secondary dark:text-dark-secondary mb-6 text-sm">{t("terms.lastUpdate")}</p>
        <section class="space-y-6 text-light-primary dark:text-dark-primary">
          <h2 class="text-xl font-semibold mt-8">{t("terms.section1.title")}</h2>
          <p class="text-light-secondary dark:text-dark-secondary leading-relaxed">{t("terms.section1.content")}</p>
          <h2 class="text-xl font-semibold mt-8">{t("terms.section2.title")}</h2>
          <p class="text-light-secondary dark:text-dark-secondary leading-relaxed">{t("terms.section2.content")}</p>
          <h2 class="text-xl font-semibold mt-8">{t("terms.section3.title")}</h2>
          <p class="text-light-secondary dark:text-dark-secondary leading-relaxed">{t("terms.section3.content")}</p>
          <h2 class="text-xl font-semibold mt-8">{t("terms.section4.title")}</h2>
          <p class="text-light-secondary dark:text-dark-secondary leading-relaxed">{t("terms.section4.content")}</p>
          <h2 class="text-xl font-semibold mt-8">{t("terms.section5.title")}</h2>
          <p class="text-light-secondary dark:text-dark-secondary leading-relaxed">{t("terms.section5.content")}</p>
        </section>
      </article>
    </div>
  );
};

export default Terminos;
