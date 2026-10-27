// eslint-disable-next-line @typescript-eslint/no-inferrable-types
const __patreon_mode__: number = -1;
// eslint-disable-next-line @typescript-eslint/no-inferrable-types
const __isProduction__: boolean = false;

export const NO_PATREON = __patreon_mode__ == 0;
export const PATREON_FREE_TIER = __patreon_mode__ == 1;
export const PATREON_SUPPORTER = __patreon_mode__ == 2;
export const PATREON_POWERUSER = __patreon_mode__ == 3;

export const HAS_ADVERTISEMENT = NO_PATREON || PATREON_FREE_TIER;

export const PATREON_IS_LOGGED = __patreon_mode__ != 0;

export const PRODUCTION = __isProduction__;


export const TESTING = !__isProduction__;
