const Config = {
  DEBUG: true
};

export const DEBUG = Config.DEBUG && import.meta.env.DEV;
