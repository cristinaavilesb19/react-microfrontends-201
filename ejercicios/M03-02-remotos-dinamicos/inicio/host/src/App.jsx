import Banner from 'banner/Banner';

// La URL del banner está fijada en webpack.config.js: cambiarla obliga a recompilar el host.
export default function App() {
  return (
    <main>
      <h1>Host (puerto 3000)</h1>
      <Banner />
    </main>
  );
}
