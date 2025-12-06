import path from 'node:path';
import webpack from 'webpack';

import HtmlWebpackPlugin from 'html-webpack-plugin';

const prod = process.env.NODE_ENV === 'production';
const __dirname = 'build'

export default {
  mode: prod ? 'production' : 'development',
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
    path: path.resolve(__dirname, './public'),
  },
  devServer: {
    static: path.join(__dirname, './public'),
    compress: true,
    port: 4000,
  },
  performance: {
    hints: false,
    maxEntrypointSize: 1000000,
    maxAssetSize: 1000000
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    }),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify({ NSTRUMENTA_LOCAL: false })
    })
  ],
}
