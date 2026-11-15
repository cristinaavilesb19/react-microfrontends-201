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
      name: 'contador',
      filename: 'remoteEntry.js',
      exposes: { './Contador': './src/Contador.jsx' },
      // Sin «shared»: cada aplicación lleva su propia copia de React.
    }),
    new HtmlWebpackPlugin({ template: './public/index.html', publicPath: '/' }),
  ],
};
