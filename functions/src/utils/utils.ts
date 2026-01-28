export const truncateText = (text: string, maxLength: number) => {
  return text.length > maxLength ? text.substring(0, maxLength - 3) + "..." : text;
};

export const timeoutPromise = <T>(ms: number): Promise<T> => new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));
