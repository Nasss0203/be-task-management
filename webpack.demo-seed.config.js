const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = (options) => ({
  ...options,
  entry: path.resolve(__dirname, 'src/database/seeds/demo-large.seed.ts'),
  output: {
    ...options.output,
    path: path.resolve(__dirname, 'dist-seeds'),
    filename: 'demo-large.seed.js',
  },
  optimization: {
    ...options.optimization,
    minimize: false,
  },
  externals: [nodeExternals()],
});
