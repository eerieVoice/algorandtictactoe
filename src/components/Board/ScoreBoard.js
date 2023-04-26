import React from 'react';

import '../styles/ScoreBoard.css';

export const ScoreBoard = ({ count1, count2, xPlaying }) => {
  return (
    <div className='scoreboard'>
      <span className={`score x-score ${!xPlaying && 'inactive'}`}>
        X - {count1}
      </span>
      <span className={`score o-score ${xPlaying && 'inactive'}`}>
        O - {count2}
      </span>
    </div>
  );
};
