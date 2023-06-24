import * as functions from "firebase-functions";
import { OpenAIClient } from "../clients/openAIClient";
import { timeoutPromise } from "../utils/utils";

export const getTranslatedSummaryFromUrl = async (url: string): Promise<string> => {
  const openAIClient = new OpenAIClient(functions.config().openai.api_key);
  const summary = await Promise.race([
    openAIClient.summarize(url),
    timeoutPromise(230000),
  ]);
  if (summary && summary.length > 10) {
    const translatedSummary = await openAIClient.complete(`
あなたはプロの翻訳者です。以下の英文を自然な日本語に翻訳してください。
---
${summary}
---
結果:
    `.trim());
    return translatedSummary;
  } else {
    throw new Error("No summary found.");
  }
};
