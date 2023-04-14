import React from 'react';
import logoHeader from './logo.svg';

import './Logo.css';

export const Logo = () => {
  return <img src={logoHeader} alt='Logo' className='logo' />;
};
