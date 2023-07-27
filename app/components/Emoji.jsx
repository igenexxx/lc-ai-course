import React from 'react';

const Emoji = ({ symbol, label, color }) => (
  <span role="img" aria-label={label} className={`text-${color}-500`}>
    {symbol}
  </span>
);

export default Emoji;
