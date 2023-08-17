export default function extractVideoId(url) {
  return new URLSearchParams(new URL(url).search).get('v');
}
