'use client';
import React, { useState } from 'react';
import Emoji from '../components/Emoji';

// React functional component
const NextJSTutorial = () => {
  // Logic, functions, data goes here
  const firstName = 'John';

  const [lastName, setLastName] = useState('Doe');
  const handleSubmit = async () => {
    const response = await fetch('/api/nextjs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lastName }),
    });

    const data = await response.json();
    setLastName(data.lastName);
  };

  // Each component returns some JSX => allows us to write HTML in React Better
  return (
    <div>
      <p>This is where the page appears</p>
      <p>Tailwind CSS is awesome</p>
      <p className="text-red-500">{firstName}</p>

      <div className="flex flex-col space-y-4">
        <div>
          <p>My last name is: {lastName}</p>
          <input
            type="text"
            className="outline w-32 rounded-md"
            onChange={({ target: { value } }) => setLastName(value)}
          />

          <button onClick={handleSubmit}>Submit</button>
        </div>
      </div>

      <Emoji symbol="👋" label="wave" color="red" />
    </div>
  );
};

export default NextJSTutorial;
