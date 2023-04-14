import React from 'react';
import logoHeader from '../assets/logopo.png';

import './styles/Logo.css';

export const Logo = () => {
  return <img src={logoHeader} alt='Logo' className='logo' />;
};
