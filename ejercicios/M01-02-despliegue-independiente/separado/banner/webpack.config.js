const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, '../publicado/banner'),   // dónde se publica
    filename: 'banner.js',
    clean: true,
  },
  resolve: { extensions: ['.js', '.jsx'] },
  module: { rules: [{ test: /\.jsx?$/, exclude: /node_modules/, use: { loader: 'babel-loader', options: { presets: [['@babel/preset-react', { runtime: 'automatic' }]] } } }] },
};
