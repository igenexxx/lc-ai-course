import { OpenAI } from "langchain/llms/openai";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { SerpAPI } from "langchain/tools";
import { Calculator } from "langchain/tools/calculator";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { PlanAndExecuteAgentExecutor } from "langchain/experimental/plan_and_execute";
import { exec } from "child_process";
import { dedent, getKeys } from '../utils/strings.mjs';

// LLM Chain

console.log(process.env?.OPENAI_API_KEY);

// 1. Creates Prompt Template (format)

const template = dedent`
  You are a director of social media with 30 years of experience.
  Please give me some ideas for content I should write about regarding {topic}.
  The content is for {socialPlatform}.
  Translate to {language}.
`;

const prompt = new PromptTemplate({
  template,
  inputVariables: getKeys(template),
});

/*const formattedPromptTemplate = await prompt.format({
  topic: 'social media',
  socialPlatform: 'Twitter',
  language: 'Lithuanian',
});

console.log(formattedPromptTemplate);*/

// 2. Creates LLM Chain (Call to OpenAI API)
// 0 = not creative, 1 = very creative
// const model = new OpenAI({ temperature: 0.7 });
// const chain = new LLMChain({ prompt, llm: model });

/*const resChain = await chain.call({
  topic: 'social media',
  socialPlatform: 'Twitter',
  language: 'Lithuanian',
});

console.log(resChain);*/

// Chain = pre-defined behavior
// Example: 1. research => API call. 2. Summarize results => API call. 3. Write summary => API call.
// Agent = task + tools + template => it figures out what to do
const agentModel = new OpenAI({
  temperature: 0,
  modelName: 'gpt-3.5-turbo',
});

const tools = [
  new SerpAPI(process.env.SERPAPI_API_KEY, {
    location: 'Lithuania',
    hl: 'en',
    gl: 'lt',
  }),
  new Calculator(),
];

/*const executor = await initializeAgentExecutorWithOptions(
  tools,
  agentModel,
  {
    agentType: 'zero-shot-react-description',
    verbose: true,
    maxIterations: 5,
  }
);

const input = "What is LangChain?";
const result = await executor.call({ input });

console.log(result);*/

/*
* Plan and Action agent
* */

/*const chatModel = new ChatOpenAI({
  temperature: 0,
  modelName: 'gpt-3.5-turbo',
  verbose: true,
});

const executor = PlanAndExecuteAgentExecutor.fromLLMAndTools({
  llm: chatModel,
  tools,
});*/

// We don't tell it HOW to do it, we tell it WHAT to do
/*const result = await executor.call({
  input: 'How many belarusians live in Lithuania?',
});

console.log(result);*/
const llm = new OpenAI({});
const memory = new BufferMemory();
const conversationChain = new ConversationChain({
  llm,
  memory
});

const input1 = `My cat's name is Meow`;
const result1 = await conversationChain.call({ input: input1 });

console.log(input1);
console.log(result1);

const input2 = 'What is the name of my cat?';
const result2 = await conversationChain.call({ input: input2 });

console.log(input2);
console.log(result2);
