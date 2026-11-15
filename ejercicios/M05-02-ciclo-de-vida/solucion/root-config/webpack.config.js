const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: { publicPath: 'auto', clean: true },
  resolve: { extensions: ['.js', '.jsx'] },
  devtool: 'source-map',
  devServer: {
    port: 3000,
    historyApiFallback: true,
    allowedHosts: 'all',
    headers: { 'Access-Control-Allow-Origin': '*' },
    client: { webSocketURL: 'auto://0.0.0.0:0/ws', overlay: false },
    // Los remotes se piden en el mismo origen (/mf/<nombre>/) y el servidor los reenvía a su puerto.
    proxy: [
      { context: ['/mf/reloj'], target: 'http://localhost:3001', pathRewrite: { '^/mf/reloj': '' } },
      { context: ['/mf/inestable'], target: 'http://localhost:3002', pathRewrite: { '^/mf/inestable': '' } },
    ],
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
      name: 'root',
      remotes: {
        reloj: 'reloj@/mf/reloj/remoteEntry.js',
        inestable: 'inestable@/mf/inestable/remoteEntry.js',
      },
      // El root-config no usa React, pero lo comparte para que todas las microaplicaciones usen el mismo.
      shared: { react: { singleton: true }, 'react-dom': { singleton: true }, 'single-spa': { singleton: true } },
    }),
    new HtmlWebpackPlugin({ template: './public/index.html', publicPath: '/' }),
  ],
};
