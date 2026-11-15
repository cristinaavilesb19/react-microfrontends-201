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
      { context: ['/mf/buscador'], target: 'http://localhost:3001', pathRewrite: { '^/mf/buscador': '' } },
      { context: ['/mf/resultados'], target: 'http://localhost:3002', pathRewrite: { '^/mf/resultados': '' } },
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
      name: 'host',
      remotes: {
        buscador: 'buscador@/mf/buscador/remoteEntry.js',
        resultados: 'resultados@/mf/resultados/remoteEntry.js',
      },
      shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
    }),
    new HtmlWebpackPlugin({ template: './public/index.html', publicPath: '/' }),
  ],
};
