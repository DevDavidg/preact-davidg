const getEnvVar = (key: string, defaultValue: boolean = false): boolean => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === "true";
};

const isDevelopment = (): boolean => {
  return import.meta.env.MODE === "development";
};

const FORCE_PRODUCTION_MODE = false;

export const ENV = {
  TESTING: FORCE_PRODUCTION_MODE
    ? false
    : getEnvVar("VITE_TESTING") || isDevelopment(),
  PERFORMANCE_OPTIMIZER_ENABLED: FORCE_PRODUCTION_MODE
    ? false
    : getEnvVar("VITE_PERFORMANCE_OPTIMIZER_ENABLED") || isDevelopment(),
  PERFORMANCE_MONITOR_ENABLED: FORCE_PRODUCTION_MODE
    ? false
    : getEnvVar("VITE_PERFORMANCE_MONITOR_ENABLED") || isDevelopment(),
  PERFORMANCE_NOTIFIER_ENABLED: FORCE_PRODUCTION_MODE
    ? false
    : getEnvVar("VITE_PERFORMANCE_NOTIFIER_ENABLED") || isDevelopment(),
};
