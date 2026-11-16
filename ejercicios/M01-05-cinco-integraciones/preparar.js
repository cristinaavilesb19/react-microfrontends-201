// Deja en publicado/ lo que el navegador necesita y no está en el código fuente:
// las librerías (desde node_modules de la raíz) y el build de Module Federation.
const { cpSync, mkdirSync, rmSync } = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const raiz = path.resolve(__dirname, '../..');
const vendor = path.join(__dirname, 'publicado/vendor');
rmSync(path.join(__dirname, 'publicado'), { recursive: true, force: true });
mkdirSync(vendor, { recursive: true });
cpSync(path.join(raiz, 'node_modules/single-spa/lib/es2015/esm/single-spa.min.js'), path.join(vendor, 'single-spa.js'));
cpSync(path.join(raiz, 'node_modules/qiankun/dist/index.umd.min.js'), path.join(vendor, 'qiankun.js'));
console.log('[preparar] librerías copiadas en publicado/vendor/');

execSync('npx webpack --config federacion/webpack.config.js', { cwd: __dirname, stdio: 'inherit' });
console.log('[preparar] Module Federation construido en publicado/federacion/');
