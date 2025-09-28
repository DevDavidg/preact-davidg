import esTranslations from "../locales/es.json";
import enTranslations from "../locales/en.json";

export type Locale = "es" | "en";

export interface Translations {
  common: {
    loading: string;
    error: string;
    retry: string;
    close: string;
    menu: string;
    scroll: string;
  };
  navigation: {
    home: string;
    about: string;
    projects: string;
    contact: string;
    portfolio: string;
  };
  hero: {
    welcome: string;
    title: string;
    subtitle: string;
    viewProjects: string;
    contact: string;
  };
  about: {
    title: string;
    bio: {
      name: string;
      age: string;
      title: string;
      location: string;
      specialization: string;
    };
    contact: {
      phone: string;
      email: string;
      linkedin: string;
      portfolio: string;
    };
    tabs: {
      experience: string;
      education: string;
      skills: string;
    };
    experience: {
      title: string;
      filters: {
        all: string;
        companies: string;
        freelance: string;
      };
      badges: {
        company: string;
        freelance: string;
      };
    };
    education: {
      title: string;
      formal: string;
      courses: string;
    };
    skills: {
      title: string;
      level: string;
      softSkills: string;
      filters: {
        all: string;
        frontend: string;
        frameworks: string;
        design: string;
        tools: string;
        languages: string;
        methodologies: string;
      };
      levels: {
        expert: string;
        advanced: string;
        intermediate: string;
        basic: string;
        beginner: string;
      };
      notFound: string;
    };
  };
  projects: {
    title: string;
    subtitle: string;
    filters: {
      all: string;
      development: string;
      design: string;
      allTechnologies: string;
    };
    badges: {
      design: string;
      video: string;
      animated: string;
    };
    actions: {
      viewDemo: string;
      viewCode: string;
    };
    loading: string;
    error: {
      title: string;
      retry: string;
    };
    empty: {
      title: string;
      description: string;
      showAll: string;
    };
    imageError: string;
  };
  contact: {
    title: string;
    subtitle: string;
    connect: string;
    description: string;
    contactInfo: {
      email: string;
      location: string;
      locationValue: string;
    };
    follow: string;
    form: {
      title: string;
      name: string;
      namePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      subject: string;
      subjectPlaceholder: string;
      message: string;
      messagePlaceholder: string;
      submit: string;
      submitting: string;
      validation: {
        nameRequired: string;
        emailRequired: string;
        emailInvalid: string;
        messageRequired: string;
        messageMinLength: string;
      };
      success: string;
      error: string;
    };
  };
  footer: {
    title: string;
    description: string;
    follow: string;
    quickLinks: string;
    links: {
      home: string;
      projects: string;
      services: string;
      about: string;
      contact: string;
    };
    newsletter: {
      title: string;
      description: string;
      placeholder: string;
      subscribe: string;
      success: string;
    };
    copyright: string;
    legal: {
      privacy: string;
      terms: string;
      sitemap: string;
    };
  };
  social: {
    github: string;
    linkedin: string;
    twitter: string;
    instagram: string;
  };
  accessibility: {
    openMenu: string;
    closeMenu: string;
    switchToDark: string;
    switchToLight: string;
    scrollToTop: string;
    viewDemo: string;
    viewCode: string;
    filterBy: string;
    showAll: string;
    showOnly: string;
    technology: string;
    additionalTechnologies: string;
    animatedContent: string;
    designProject: string;
  };
}

const translations: Record<Locale, Translations> = {
  es: esTranslations as Translations,
  en: enTranslations as Translations,
};

class I18nManager {
  private currentLocale: Locale = "es";

  constructor() {
    // Try to get locale from localStorage or browser language
    const savedLocale = localStorage.getItem("locale") as Locale;
    const browserLocale = navigator.language.split("-")[0] as Locale;

    if (savedLocale && translations[savedLocale]) {
      this.currentLocale = savedLocale;
    } else if (translations[browserLocale]) {
      this.currentLocale = browserLocale;
    }
  }

  getLocale(): Locale {
    return this.currentLocale;
  }

  setLocale(locale: Locale): void {
    if (translations[locale]) {
      this.currentLocale = locale;
      localStorage.setItem("locale", locale);
      // Dispatch custom event for components to react to locale changes
      window.dispatchEvent(
        new CustomEvent("localeChanged", { detail: { locale } })
      );
    }
  }

  t(key: string): string {
    const keys = key.split(".");
    let value: any = translations[this.currentLocale];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        console.warn(
          `Translation key "${key}" not found for locale "${this.currentLocale}"`
        );
        return key; // Return the key itself as fallback
      }
    }

    return typeof value === "string" ? value : key;
  }

  getTranslations(): Translations {
    return translations[this.currentLocale];
  }
}

// Create singleton instance
export const i18n = new I18nManager();

// Hook for React/Preact components
export const useTranslation = () => {
  return {
    t: i18n.t.bind(i18n),
    locale: i18n.getLocale(),
    setLocale: i18n.setLocale.bind(i18n),
    translations: i18n.getTranslations(),
  };
};

// Utility function for getting nested translation values
export const getTranslation = (
  key: string,
  locale: Locale = i18n.getLocale()
): string => {
  const keys = key.split(".");
  let value: any = translations[locale];

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      return key;
    }
  }

  return typeof value === "string" ? value : key;
};

export default i18n;
