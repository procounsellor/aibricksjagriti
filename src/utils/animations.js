/**
 * Common animation utilities
 */

/**
 * Smooth ease-out cubic function
 * @param {number} t - Progress value between 0 and 1
 * @returns {number} Eased value
 */
export const easeOutCubic = (t) => {
  return 1 - Math.pow(1 - t, 3);
};

/**
 * Smooth ease-in-out cubic function
 * @param {number} t - Progress value between 0 and 1
 * @returns {number} Eased value
 */
export const easeInOutCubic = (t) => {
  return t < 0.5 
    ? 4 * t * t * t 
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/**
 * Smooth ease-in cubic function
 * @param {number} t - Progress value between 0 and 1
 * @returns {number} Eased value
 */
export const easeInCubic = (t) => {
  return t * t * t;
};

/**
 * Smooth step function (smoothstep)
 * @param {number} t - Progress value between 0 and 1
 * @returns {number} Smoothed value
 */
export const smoothStep = (t) => {
  return t * t * (3 - 2 * t);
};

/**
 * Elastic ease-out for bouncy animations
 * @param {number} t - Progress value between 0 and 1
 * @returns {number} Eased value
 */
export const easeOutElastic = (t) => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
    ? 1
    : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

/**
 * Back ease-out for overshoot effect
 * @param {number} t - Progress value between 0 and 1
 * @returns {number} Eased value
 */
export const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
