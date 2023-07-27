'use client';
import React, { useState } from 'react';
import Title from '../components/Title';
import TwoColumnLayout from '../components/TwoColumnLayout';
import PageHeader from '../components/PageHeader';
import ResultWithSources from '../components/ResultWithSources';
import PromptBox from '../components/PromptBox';

const Memory = () => {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([
    {
      text: `Hi there! What's your name and favourite food?`,
      type: 'bot',
    },
  ]);
  const [firstMsg, setFirstMsg] = useState(true);

  const handlePromptChange = ({ target: { value } }) => setPrompt(value);
  const handleSubmitPrompt = async () => {
    setMessages((messages) => [...messages, { text: prompt, type: 'user', sourceDocuments: null }]);
    const response = await fetch('/api/memory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: prompt, firstMsg }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        setPrompt('');
        setFirstMsg(false);

        setError(null);

        return response.json();
      })
      .catch((err) => {
        console.error(err);
        setError(err);
      });

    if (response) {
      console.log(response);
      setMessages((messages) => [
        ...messages,
        {
          text: response.output.response,
          type: 'bot',
          sourceDocuments: response.sourceDocuments,
        },
      ]);
    }
  };

  return (
    <>
      <Title headingText={'Memory'} emoji="🧠" />
      <TwoColumnLayout
        leftChildren={
          <>
            <PageHeader
              heading="I remember everything"
              boldText="Let's see if you can remember everything. This tool will let you ask anything contained in a PDF document."
              description="This tool uses Buffer Memory and Conversation Chain. Head over to Module X to get started!"
            />
          </>
        }
        rightChildren={
          <>
            <ResultWithSources messages={messages} pngFile="brain" />
            <PromptBox
              prompt={prompt}
              handleSubmit={handleSubmitPrompt}
              error={error}
              handlePromptChange={handlePromptChange}
            />
          </>
        }
      />
    </>
  );
};

export default Memory;
