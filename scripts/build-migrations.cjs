// Nest's application webpack bundle does not emit a CLI DataSource or migrations.
const fs = require('node:fs');
const path = require('node:path');
const webpack = require('webpack');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(root, 'src/database/migration-review-manifest.json'),
    'utf8',
  ),
);
for (const record of manifest.files) {
  const file = path.join(root, 'src/database/migrations', record.file);
  const hash = crypto
    .createHash('sha256')
    .update(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n'))
    .digest('hex');
  if (hash !== record.sha256)
    throw new Error('Reviewed migration changed: ' + record.file);
}
const entry = { 'data-source': path.join(root, 'src/database/data-source.ts') };
entry['migration-preflight'] = path.join(
  root,
  'scripts/migration-preflight.ts',
);
entry['baseline-tools'] = path.join(root, 'scripts/baseline-tools.ts');
for (const { file } of manifest.files) {
  entry['migrations/' + file.slice(0, -3)] = path.join(
    root,
    'src/database/migrations',
    file,
  );
}
webpack(
  {
    mode: 'production',
    target: 'node',
    entry,
    output: {
      path: path.join(root, 'dist/database'),
      filename: '[name].js',
      library: { type: 'commonjs2' },
    },
    node: { __dirname: false, __filename: false },
    resolve: {
      extensions: ['.ts', '.js'],
      alias: { src: path.join(root, 'src') },
    },
    externals: [
      ({ request }, callback) => {
        if (
          request &&
          !request.startsWith('.') &&
          !path.isAbsolute(request) &&
          !request.startsWith('src/')
        )
          return callback(null, 'commonjs ' + request);
        callback();
      },
    ],
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            compilerOptions: {
              module: 'commonjs',
              moduleResolution: 'node',
              resolvePackageJsonExports: false,
            },
          },
        },
      ],
    },
    optimization: { minimize: false },
  },
  (error, stats) => {
    if (error || stats.hasErrors()) {
      console.error(
        error ? error.message : stats.toString({ all: false, errors: true }),
      );
      process.exitCode = 1;
    } else {
      fs.cpSync(
        path.join(root, 'src/database/baselines'),
        path.join(root, 'dist/database/baselines'),
        { recursive: true },
      );
      const files = manifest.files.map((record) => {
        const file = record.file.replace(/\.ts$/, '.js');
        const content = fs.readFileSync(
          path.join(root, 'dist/database/migrations', file),
          'utf8',
        );
        return {
          ...record,
          sourceSha256: record.sha256,
          file,
          sha256: crypto
            .createHash('sha256')
            .update(content.replace(/\r\n/g, '\n'))
            .digest('hex'),
        };
      });
      fs.writeFileSync(
        path.join(root, 'dist/database/migration-review-manifest.json'),
        JSON.stringify({ files }, null, 2) + '\n',
      );
      console.log(
        'Built CLI DataSource, preflight and ' +
          (Object.keys(entry).length - 3) +
          ' migration files',
      );
    }
  },
);
