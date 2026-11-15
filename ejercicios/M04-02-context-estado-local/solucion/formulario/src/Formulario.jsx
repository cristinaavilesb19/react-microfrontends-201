import { FormularioProvider, useFormulario } from './FormularioContext';

// Cada instancia crea su Provider: su estado es local a esa instancia de la microaplicación.
export default function Formulario({ titulo }) {
  return (
    <FormularioProvider>
      <fieldset>
        <legend>{titulo}</legend>
        <Pasos />
      </fieldset>
    </FormularioProvider>
  );
}

function Pasos() {
  return (
    <>
      <PasoNombre />
      <PasoCiudad />
      <Resumen />
    </>
  );
}

function PasoNombre() {
  const { datos, cambiar } = useFormulario();
  return <input placeholder="Nombre" value={datos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} />;
}

function PasoCiudad() {
  const { datos, cambiar } = useFormulario();
  return <input placeholder="Ciudad" value={datos.ciudad} onChange={(e) => cambiar('ciudad', e.target.value)} />;
}

function Resumen() {
  const { datos } = useFormulario();
  return <p>Resumen: {datos.nombre || '—'} · {datos.ciudad || '—'}</p>;
}
