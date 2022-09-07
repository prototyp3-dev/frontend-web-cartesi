const webpack = require("webpack")

module.exports = function override(config) {
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
      ...config.resolve.fallback,
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "assert": require.resolve("assert"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "os": require.resolve("os-browserify"),
      "buffer": require.resolve("buffer"),
      "stream": require.resolve("stream-browserify"),
      "url": require.resolve("url")
  })
  config.resolve.fallback = fallback;

  config.resolve.extensions = [...config.resolve.extensions, ".ts", ".js"]
  config.plugins = [
      ...config.plugins,
      new webpack.ProvidePlugin({
          process: "process/browser",
          Buffer: ["buffer", "Buffer"],
      }),
  ]
  // console.log(config.resolve)
  // console.log(config.plugins)
  return config;
}
