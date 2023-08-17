import axios from 'axios';

const getMetadata = async (metadataResponse) => {
  const {
    snippet: { title, description },
    id,
  } = metadataResponse;
  const [shortDescription] = description.split('.');

  return {
    id,
    title,
    description: shortDescription,
  };
};

export default async function getVideoMetaData(videoId) {
  // enable api key and setup next.config.js
  const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${process.env.GOOGLE_API_KEY}&part=snippet,contentDetails,statistics,status`;

  try {
    const {
      data: {
        items: [metadataResponse],
      },
    } = await axios.get(url);

    return getMetadata(metadataResponse);
  } catch (err) {
    console.error(`Failed to get metadata: ${err}`);
  }
}
