const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: { publicPath: 'auto', clean: true },
  resolve: { extensions: ['.js', '.jsx'] },
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
      name: 'reloj',
      filename: 'remoteEntry.js',
      exposes: { './spa': './src/spa.js' },
      shared: { react: { singleton: true }, 'react-dom': { singleton: true }, 'single-spa': { singleton: true } },
    }),
    new HtmlWebpackPlugin({ template: './public/index.html', publicPath: '/' }),
  ],
};
