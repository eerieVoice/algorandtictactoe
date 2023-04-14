import React from 'react';
import logoHeader from '../assets/logo.svg';

import './styles/Logo.css';

export const Logo = () => {
  return <img src={logoHeader} alt='Logo' className='logo' />;
};
