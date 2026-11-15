import { Component } from 'react';

// Barrera de errores: si un remote no carga, se muestra un aviso y el resto de la página sigue.
export default class BarreraErrores extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) return <p role="alert">No se ha podido cargar esta sección.</p>;
    return this.props.children;
  }
}
