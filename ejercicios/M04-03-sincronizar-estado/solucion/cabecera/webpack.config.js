const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: { publicPath: 'auto', clean: true },
  // 'tema-compartido' es el paquete local ../paquetes/tema.
  resolve: { extensions: ['.js', '.jsx'], alias: { 'tema-compartido': path.resolve(__dirname, '../paquetes/tema') } },
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
      name: 'cabecera',
      filename: 'remoteEntry.js',
      exposes: { './Cabecera': './src/Cabecera.jsx' },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        // El paquete del tema, compartido: todas las aplicaciones usan la MISMA instancia.
        'tema-compartido': { singleton: true, version: '1.0.0', requiredVersion: '1.0.0' },
      },
    }),
    new HtmlWebpackPlugin({ template: './public/index.html', publicPath: '/' }),
  ],
};
