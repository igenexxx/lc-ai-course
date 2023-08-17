// /pages/api/transcript.js
import { YoutubeTranscript } from 'youtube-transcript';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { ConversationalRetrievalQAChain } from 'langchain/chains';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';

// Global variables
let chain;
const chatHistory = [];

// DO THIS SECOND
const initializeChain = async (initialPrompt, transcript) => {
  try {
    const model = new ChatOpenAI({
      temperature: 0.7,
      modelName: 'gpt-3.5-turbo',
    });

    // HNSWLib
    const vectorStore = await HNSWLib.fromDocuments([{ pageContent: transcript }], new OpenAIEmbeddings());

    /*await vectorStore.save(process.cwd());
    const loadedVectorStore = await HNSWLib.load(process.cwd(), new OpenAIEmbeddings());
*/

    chain = ConversationalRetrievalQAChain.fromLLM(model, vectorStore.asRetriever(), { verbose: true });

    const response = await chain.call({ question: initialPrompt, chat_history: chatHistory });

    chatHistory.push({
      role: 'assistant',
      content: response.text,
    });

    return response;
  } catch (error) {
    console.error(error);
  }
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // DO THIS FIRST
    const { prompt, firstMsg } = req.body;

    // Then if it's the first message, we want to initialize the chain, since it doesn't exist yet
    if (firstMsg) {
      try {
        const initialPrompt = `Give me a summary of the transcript below. ${prompt}`;

        chatHistory.push({
          role: 'user',
          content: initialPrompt,
        });

        const transcriptRes = await YoutubeTranscript.fetchTranscript(prompt);

        if (!transcriptRes) {
          return res.status(400).json({ error: 'No transcript found' });
        }

        const transcript = transcriptRes.map((item) => item.text).join(' ');

        const response = await initializeChain(initialPrompt, transcript);

        return res.status(200).json({ output: response, chatHistory });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'An error occurred while fetching transcript' });
      }

      // do this third!
    } else {
      try {
        chatHistory.push({
          role: 'user',
          content: prompt,
        });

        const response = await chain.call({ question: prompt, chat_history: chatHistory });

        chatHistory.push({
          role: 'assistant',
          content: response.text,
        });

        return res.status(200).json({ output: response, chatHistory });
      } catch (error) {
        // Generic error handling
        console.error(error);
        res.status(500).json({ error: 'An error occurred during the conversation.' });
      }
    }
  }
}
