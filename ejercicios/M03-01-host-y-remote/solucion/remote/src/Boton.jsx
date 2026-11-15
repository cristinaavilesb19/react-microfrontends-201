// Componente que este remote ofrece a otras aplicaciones.
export default function Boton({ texto = 'Soy el botón del remote' }) {
  return (
    <button style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 0, borderRadius: 6 }}
            onClick={() => console.log('clic en el Boton del remote')}>
      {texto}
    </button>
  );
}
