const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: { publicPath: 'auto', clean: true },
  // 'contexto-color' es el paquete local ../paquetes/contexto-color.
  resolve: { extensions: ['.js', '.jsx'], alias: { 'contexto-color': path.resolve(__dirname, '../paquetes/contexto-color') } },
  devtool: 'source-map',
  devServer: {
    port: 3001,
    historyApiFallback: true,
    allowedHosts: 'all',
    headers: { 'Access-Control-Allow-Origin': '*' },
    client: { webSocketURL: 'auto://0.0.0.0:0/ws', overlay: false },
  },
  module: {
    rules: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      use: { loader: 'babel-loader', options: { presets: [['@babel/preset-react', { runtime: 'automatic' }]] } },
    }],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'ficha',
      filename: 'remoteEntry.js',
      exposes: { './Ficha': './src/Ficha.jsx' },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        'contexto-color': { singleton: true, version: '1.0.0', requiredVersion: '1.0.0' },
      },
    }),
    new HtmlWebpackPlugin({ template: './public/index.html', publicPath: '/' }),
  ],
};
