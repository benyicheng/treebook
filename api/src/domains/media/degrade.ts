let degradedUntil = 0;

export const tripMediaDegrade = (ms: number) => {
  degradedUntil = Math.max(degradedUntil, Date.now() + Math.max(0, ms));
};

export const isMediaDegraded = () => {
  return degradedUntil > 0 && Date.now() < degradedUntil;
};
