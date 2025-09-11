// Global variable to track discover mode
let shouldShowDiscoverMode = false;

export const setDiscoverMode = (value: boolean) => {
  shouldShowDiscoverMode = value;
};

export const getDiscoverMode = () => {
  return shouldShowDiscoverMode;
};

export const resetDiscoverMode = () => {
  shouldShowDiscoverMode = false;
};
