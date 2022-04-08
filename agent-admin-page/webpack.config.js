import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import webpack from 'webpack';

const __dirname = dirname(fileURLToPath(import.meta.url))

export default {
  entry: './src/index.ts',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, '../public'),
  },
  devServer: {
    static: path.join(__dirname, '../public'),
    compress: true,
    port: 4000,
  },
  performance: {
    hints: false,
    maxEntrypointSize: 1000000,
    maxAssetSize: 1000000
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': JSON.stringify({ NSTRUMENTA_LOCAL: false })
    })
  ],
}
