module.exports = (options) => ({
  ...options,

  externals: [
    ...(Array.isArray(options.externals) ? options.externals : []),

    {
      playwright: 'commonjs playwright',
      'playwright-core': 'commonjs playwright-core',
    },
  ],
});
