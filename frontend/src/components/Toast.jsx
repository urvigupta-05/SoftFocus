import React from 'react';
import '../styles/layout.css';

export default function Toast({ message, show }) {
  return (
    <div className={`toast ${show ? 'show' : ''}`}>
      {message}
    </div>
  );
}
