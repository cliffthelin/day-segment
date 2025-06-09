const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: true,
})

// This is a separate file that's only used when running the analyze script
module.exports = withBundleAnalyzer({})
