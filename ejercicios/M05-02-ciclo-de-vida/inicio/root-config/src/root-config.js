import { registerApplication, start } from 'single-spa';

registerApplication({ name: 'reloj', app: () => import('reloj/spa'), activeWhen: '/' });
registerApplication({ name: 'inestable', app: () => import('inestable/spa'), activeWhen: '/panel' });

start();
