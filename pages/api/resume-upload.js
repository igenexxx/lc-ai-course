// /pages/api/resume_upload.js
// Import dependencies

/**
 * This endpoint is used to load the resumes into the chain, then upload them to the Pinecone database.
 * Tutorial: https://js.langchain.com/docs/modules/indexes/document_loaders/examples/file_loaders/directory
 * Summarization: https://js.langchain.com/docs/modules/chains/other_chains/summarization
 * Dependencies: npm install pdf-parse
 */
import path from 'node:path';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { CharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { PineconeClient } from '@pinecone-database/pinecone';
import { loadSummarizationChain } from 'langchain/chains';
import { OpenAI } from 'langchain/llms/openai';

const getName = (pdfPath) => {
  const fileName = path.basename(pdfPath, '.pdf');
  const [firstName, lastName] = fileName.replace('resume_', '').split('_');

  return {
    firstName,
    lastName,
  };
};

export default async function handler(req, res) {
  // Grab the prompt from the url (?prompt=[value])
  //   console.log(process.env.PINECONE_API_KEY);
  //   console.log(process.env.PINECONE_ENVIRONMENT);
  //   console.log(process.env.PINECONE_INDEX);
  // Always use a try catch block to do asynchronous requests and catch any errors
  try {
    // load the directory
    const loader = new DirectoryLoader(path.join(process.cwd(), 'data', 'resumes'), {
      '.pdf': (path) => new PDFLoader(path, '/pdf'),
    });

    const docs = await loader.load();

    console.log(`Loaded ${docs.length} documents`);

    const splitter = new CharacterTextSplitter({
      separator: ' ',
      chunkSize: 200,
      chunkOverlap: 20,
    });

    const splitDocs = await splitter.splitDocuments(docs);

    const updatedDocs = splitDocs.map((doc) => ({
      ...doc,
      metadata: {
        ...getName(doc.metadata.source),
        docType: 'resume',
      },
    }));

    const model = new OpenAI({ temperature: 0 });
    const summarizeAllChain = loadSummarizationChain(model, { type: 'map_reduce' });
    const summarizeAll = await summarizeAllChain.call({ input_documents: docs });

    const summaryList = [{ summary: summarizeAll.text }].concat(
      await Promise.allSettled(
        docs.map(async (doc) => {
          const summarizeChain = loadSummarizationChain(model, { type: 'map_reduce' });
          const summarize = await summarizeChain.call({ input_documents: [doc] });
          return { summary: summarize.text };
        }),
      ),
    );

    console.log('summaryList', summaryList);

    // Upload the reducedDocs to Pinecone
    const client = new PineconeClient();
    await client.init({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT,
    });
    const pineconeIndex = client.Index(process.env.PINECONE_INDEX);
    await PineconeStore.fromDocuments(updatedDocs, new OpenAIEmbeddings(), { pineconeIndex });

    // Return the response
    return res.status(200).json({ output: summaryList });
  } catch (err) {
    // If we have an error

    console.error(err);
    return res.status(500).json({ error: err });
  }
}
