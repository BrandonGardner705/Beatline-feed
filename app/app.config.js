// Lets the GitHub build serve the web app from /Beatline-feed/app/ while local builds use /.
module.exports = ({ config }) => ({
  ...config,
  experiments: { ...(config.experiments || {}), baseUrl: process.env.EXPO_BASE_URL || '' },
});
