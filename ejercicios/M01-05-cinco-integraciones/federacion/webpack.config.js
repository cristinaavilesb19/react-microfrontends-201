// Tres builds de Module Federation: dos remotes (los mismos mfe.js de siempre) y el shell que los consume.
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

const salida = (nombre) => path.resolve(__dirname, '../publicado/federacion', nombre);

const remote = (nombre) => ({
  name: nombre,
  mode: 'production',
  context: __dirname,
  entry: {},                                             // sin página propia: solo el contenedor
  output: { path: salida(nombre), publicPath: 'auto', clean: true },
  plugins: [
    new ModuleFederationPlugin({ name: nombre, filename: 'remoteEntry.js', exposes: { './mfe': `../${nombre}/mfe.js` } }),
  ],
});

const shell = {
  name: 'shell',
  mode: 'production',
  context: __dirname,
  entry: './shell.js',
  output: { path: salida('shell'), publicPath: '/publicado/federacion/shell/', clean: true },
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      remotes: {
        catalogo: 'catalogo@/publicado/federacion/catalogo/remoteEntry.js',
        reloj: 'reloj@/publicado/federacion/reloj/remoteEntry.js',
      },
    }),
    new HtmlWebpackPlugin({ template: './index.html' }),
  ],
};

module.exports = [remote('catalogo'), remote('reloj'), shell];
