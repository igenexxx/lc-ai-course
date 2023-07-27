import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { PineconeClient } from '@pinecone-database/pinecone';
import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { CharacterTextSplitter } from 'langchain/text_splitter';

// Example: https://js.langchain.com/docs/modules/indexes/document_loaders/examples/file_loaders/pdf
export default async function handler(req, res) {
  if (req.method === 'GET') {
    console.log('Inside the PDF handler');
    // Enter your code here
    /** STEP ONE: LOAD DOCUMENT */
    const bookPath = './data/document_loaders/naval-ravikant-book.pdf';
    const loader = new PDFLoader(bookPath);
    const docs = await loader.load();

    console.log('Document loaded', docs);
    // Chunk it
    if (docs.length === 0) {
      throw new Error('No documents loaded');
    }

    const splitter = new CharacterTextSplitter({
      separator: ' ',
      chunkOverlap: 10,
      chunkSize: 250,
    });

    const splitDocs = await splitter.splitDocuments(docs);

    // Reduce the size of the metadata
    const reducedDocs = splitDocs.map((doc) => {
      const {
        metadata: { pdf, ...restMetadata },
        pageContent,
      } = doc;

      return new Document({
        pageContent,
        metadata: restMetadata,
      });
    });

    console.log(reducedDocs[0]);
    console.log(splitDocs.length);

    /** STEP TWO: UPLOAD TO DATABASE */
    const client = new PineconeClient();

    await client.init({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT,
    });

    // langchain-js
    const pineconeIndex = client.Index(process.env.PINECONE_INDEX);

    // upload documents to Pinecone
    await PineconeStore.fromDocuments(reducedDocs, new OpenAIEmbeddings(), {
      pineconeIndex,
    });

    console.log('Successfully uploaded to Pinecone');

    // upload documents to Pinecone
    return res.status(200).json({ result: reducedDocs });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
