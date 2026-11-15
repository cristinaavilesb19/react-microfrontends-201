import React from 'react';
import ReactDOMClient from 'react-dom/client';
import singleSpaReact from 'single-spa-react';
import App from './App';

// single-spa-react convierte el componente raíz en las funciones del ciclo de vida.
export const { bootstrap, mount, unmount } = singleSpaReact({
  React,
  ReactDOMClient,
  rootComponent: App,
  // Si el componente falla, se pinta esto en su contenedor y el resto de la página sigue.
  errorBoundary: (error) => <p role="alert">inestable no está disponible ({error.message})</p>,
});
