const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, '../publicado'),
    filename: '[name].[contenthash:8].js',
    // Limpia solo lo suyo: la carpeta banner/ es de otro equipo.
    clean: { keep: /^banner\// },
  },
  resolve: { extensions: ['.js', '.jsx'] },
  module: { rules: [{ test: /\.jsx?$/, exclude: /node_modules/, use: { loader: 'babel-loader', options: { presets: [['@babel/preset-react', { runtime: 'automatic' }]] } } }] },
  plugins: [new HtmlWebpackPlugin({ template: './public/index.html' })],
};
