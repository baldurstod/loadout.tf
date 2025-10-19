const __patreon_mode__: number = -1;
const __isProduction__: boolean = false;

export const ENABLE_PATREON_BASE = __patreon_mode__ == 0;
export const ENABLE_PATREON_SUPPORTER = __patreon_mode__ == 1;
export const ENABLE_PATREON_POWERUSER = __patreon_mode__ == 2;

export const PATREON_IS_LOGGED = __patreon_mode__ != 0;

export const PRODUCTION = __isProduction__;


export const TESTING = !__isProduction__;
