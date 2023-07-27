import { OpenAI } from 'langchain/llms/openai';
import { BufferMemory } from 'langchain/memory';
import { ConversationChain } from 'langchain/chains';

let model, memory, chain;

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { input, firstMsg } = req.body;

    if (!input) {
      res.status(400).json({ error: 'No input provided' });
      return;
    }

    if (firstMsg) {
      console.log('Initializing model...');
      model = new OpenAI({ modelName: 'gpt-3.5-turbo' });
      memory = new BufferMemory();
      chain = new ConversationChain({ llm: model, memory });
    }

    const output = await chain.call({ input });

    res.status(200).json({ output });
  } else {
    res.status(405).json({ error: 'Only POST requests allowed' });
  }
}
