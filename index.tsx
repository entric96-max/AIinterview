import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Wait for the DOM to be fully loaded before initializing the React app.
// This prevents race conditions and potential errors like React Error #310.
window.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
