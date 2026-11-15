const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: { path: path.resolve(__dirname, 'dist'), filename: '[name].[contenthash:8].js', clean: true },
  resolve: { extensions: ['.js', '.jsx'] },
  module: { rules: [{ test: /\.jsx?$/, exclude: /node_modules/, use: { loader: 'babel-loader', options: { presets: [['@babel/preset-react', { runtime: 'automatic' }]] } } }] },
  plugins: [new HtmlWebpackPlugin({ template: './public/index.html' })],
};
