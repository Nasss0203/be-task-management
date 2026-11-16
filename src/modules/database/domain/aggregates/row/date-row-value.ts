export const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export const DATE_TIME_KEY = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export const isTimeZone = (value: unknown): value is string => {
  if (typeof value !== 'string' || !value) {
    return false;
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
};
