import { useState } from 'react';

// El estado vive arriba y baja por props a través de componentes que no lo usan.
export default function Formulario({ titulo }) {
  const [datos, setDatos] = useState({ nombre: '', ciudad: '' });
  return (
    <fieldset>
      <legend>{titulo}</legend>
      <Pasos datos={datos} setDatos={setDatos} />
    </fieldset>
  );
}

function Pasos({ datos, setDatos }) {
  // Pasos no usa datos: solo los reenvía.
  return (
    <>
      <PasoNombre datos={datos} setDatos={setDatos} />
      <PasoCiudad datos={datos} setDatos={setDatos} />
      <Resumen datos={datos} />
    </>
  );
}

function PasoNombre({ datos, setDatos }) {
  return <input placeholder="Nombre" value={datos.nombre} onChange={(e) => setDatos({ ...datos, nombre: e.target.value })} />;
}

function PasoCiudad({ datos, setDatos }) {
  return <input placeholder="Ciudad" value={datos.ciudad} onChange={(e) => setDatos({ ...datos, ciudad: e.target.value })} />;
}

function Resumen({ datos }) {
  return <p>Resumen: {datos.nombre || '—'} · {datos.ciudad || '—'}</p>;
}
