export function dedent(...inputs) {
  const [strings, ...values] = inputs;
  const text = strings.reduce((prev, next, i) => prev + (values[i - 1] ?? '') + next);
  const lines = text.split('\n');
  const indent = lines.reduce((prev, line) => {
    if (line.match(/^\s*$/)) {
      return prev; // Completely ignore blank lines.
    }
    const lineIndent = line.match(/^\s*/)?.[0].length ?? 0;
    return lineIndent < prev ? lineIndent : prev;
  }, Infinity);
  return lines.map((line) => line.slice(indent)).join('\n');
}

export const getKeys = (string) => string.match(/(?<={)([^\s]+)(?=})/g);
