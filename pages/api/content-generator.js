// /pages/api/transcript_chat.js
import { YoutubeTranscript } from 'youtube-transcript';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { LLMChain } from 'langchain/chains';
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from 'langchain/prompts';
import extractVideoId from '../../utils/extractVideoId';
import getVideoMetaData from '../../utils/getVideoMetaData';
import ResearchAgent from '../../agents/ResearchAgent';

// Global Variables
const chatHistory = [];
let chain,
  research,
  transcript = '',
  metadata = '';

// Initialize Chain with Data
const initChain = async (transcript, metadata, research, topic) => {
  try {
    const llm = new ChatOpenAI({ temperature: 0.7, modelName: 'gpt-3.5-turbo' });

    const prompt = ChatPromptTemplate.fromPromptMessages([
      SystemMessagePromptTemplate.fromTemplate(
        `You are a helpful social media assistant that provides research, new content, and advice to me.
        You are given the transcript of the video: {transcript} and video metadata: {metadata} as well as
        additional research: {research}`,
      ),
      HumanMessagePromptTemplate.fromTemplate(
        `{input}. Remember to use the video transcript and research as reference`,
      ),
    ]);

    chain = new LLMChain({ prompt, llm });

    const response = await chain.call({
      transcript,
      metadata,
      research,
      input: `Write me a script for a new video that provides commentary on this video in a lighthearted, joking manner.
      It should compliment ${topic} and be entertaining.`,
    });

    chatHistory.push({
      role: 'assistant',
      content: response.text,
    });

    return response;
  } catch (error) {
    console.error(`An error occurred during the initialization of the Chat Prompt: ${error.message}`);
    throw error; // rethrow the error to let the calling function know that an error occurred
  }
};

export default async function handler(req, res) {
  const { prompt, topic, firstMsg } = req.body;
  console.log(`Prompt: ${prompt} Topic: ${topic}`);

  if (chain === undefined && !prompt.includes('https://www.youtube.com/watch?v=')) {
    return res.status(400).json({
      error: 'Chain not initialized. Please send a YouTube URL to initialize the chain.',
    });
  }

  chatHistory.push({
    role: 'user',
    content: prompt,
  });

  // Just like in the previous section, if we have a firstMsg set to true, we need to initialize with chain with the context
  if (firstMsg) {
    console.log('Received URL');
    try {
      // Initialize chain with transcript, metadata, research, and topic
      const videoId = extractVideoId(prompt);
      const transcriptRes = await YoutubeTranscript.fetchTranscript(videoId);

      if (!transcriptRes) {
        return res.status(400).json({ error: 'No transcript found' });
      }

      transcript = transcriptRes.map(({ text }) => text).join(' ');

      // get metadata
      const metadata = await getVideoMetaData(videoId);
      console.log(metadata);

      // get research from the web
      research = await ResearchAgent(topic);
      console.log(research);

      const response = await initChain(transcript, metadata, research, topic);

      return res
        .status(200)
        .json({ output: response, metadata: JSON.stringify(metadata, null, 2), transcript, chatHistory });
      /*      return res.status(200).json({
        output: JSON.stringify(metadata, null, 2),
        chatHistory,
        transcript,
        metadata,
        research,
      })*/
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'An error occurred while fetching transcript' });
    }
  } else {
    // Very similar to previous section, don't worry too much about this just copy and paste it from the previous section!
    try {
      console.log('Received question');
      const response = await chain.call({ input: prompt, transcript, metadata, research });

      chatHistory.push({
        role: 'assistant',
        content: response.text,
      });

      // just make sure to modify this response as necessary.
      return res.status(200).json({
        output: response,
        metadata: JSON.stringify(metadata, null, 2),
        transcript,
        chatHistory,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred during the conversation.' });
    }
  }
}
