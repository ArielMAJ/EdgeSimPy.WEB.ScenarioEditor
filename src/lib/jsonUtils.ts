export const cleanInfinityValues = (text: string) =>
  text
    .replace(/:\s*Infinity/g, ": 9007199254740991")
    .replace(/\[\s*Infinity\s*\]/g, "[9007199254740991]");

export const infinityToString = (jsonString: string) =>
  jsonString
    .replace(/:\s*9007199254740991([,\n\r\s}]|$)/g, ": Infinity$1")
    .replace(/\[\s*9007199254740991\s*\]/g, "[Infinity]");
