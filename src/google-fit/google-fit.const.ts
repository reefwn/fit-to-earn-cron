const GOOGLE_FIT_BASE_URL = 'https://www.googleapis.com/fitness/v1/users/me';

export const GOOGLE_FIT_AGGREGATE_URL = `${GOOGLE_FIT_BASE_URL}/dataset:aggregate`;
export const GOOGLE_FIT_SESSION_URL = `${GOOGLE_FIT_BASE_URL}/sessions`;
export const GOOGLE_FIT_DURATION_ONE_WEEK = 86400000;

// heart
export const GOOGLE_FIT_HEART_DATA_TYPE = 'com.google.heart_minutes';
export const GOOGLE_FIT_HEART_DATA_SOURCE =
  'derived:com.google.heart_minutes:com.google.android.gms:merge_heart_minutes';
export const GOOGLE_FIT_HEART_USER_INPUT_DATA_SOURCE =
  'raw:com.google.heart_minutes:com.google.android.apps.fitness:user_input';

// step
export const GOOGLE_FIT_STEP_DATA_TYPE = 'com.google.step_count.delta';
export const GOOGLE_FIT_STEP_DATA_SOURCE =
  'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps';
export const GOOGLE_FIT_STEP_USER_INPUT_DATA_SOURCE =
  'raw:com.google.step_count.delta:com.google.android.apps.fitness:user_input';

// sleep
export const GOOGLE_FIT_SLEEP_ACTIVITY_TYPE = 72;
