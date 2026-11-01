const TARGET_TIME = /^\d{1,2}:\d{2}$/;

function validTarget(value) {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0;
  return typeof value === 'string' && TARGET_TIME.test(value);
}

function cleanTargetHours(targetHours) {
  if (targetHours === undefined) return undefined;
  if (targetHours === null || typeof targetHours !== 'object') {
    console.warn('e-days Tracker: config.targetHours is not an object, using default target hours');
    return undefined;
  }
  const clean = {};
  for (const [day, value] of Object.entries(targetHours)) {
    if (validTarget(value)) {
      clean[day] = value;
    } else {
      console.warn(`e-days Tracker: ignoring invalid target hours for ${day}: ${JSON.stringify(value)}`);
    }
  }
  return clean;
}

// `importModule` returns the config.js module; how it is fetched differs per entry point.
// Rejects with a readable message when the file cannot be loaded or has no usable allowedUrl.
export async function loadConfig(importModule) {
  let config;
  try {
    ({ config } = await importModule());
  } catch (error) {
    throw new Error(`config.js konnte nicht geladen werden: ${error.message}`);
  }
  if (typeof config?.allowedUrl !== 'string' || !config.allowedUrl) {
    throw new Error('config.js: allowedUrl fehlt');
  }
  return { allowedUrl: config.allowedUrl, targetHours: cleanTargetHours(config.targetHours) };
}
