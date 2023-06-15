import * as functions from "firebase-functions";
import { OpenAIClient } from "../clients/openAIClient";
import { timeoutPromise } from "../utils/utils";

export const getTranslatedSummaryFromUrl = async (url: string): Promise<string> => {
  const openAIClient = new OpenAIClient(functions.config().openai.api_key);
  const summary = await Promise.race([
    openAIClient.summarize(url),
    timeoutPromise(10000),
  ]);
  if (summary && summary.length > 10) {
    const translatedSummary = await openAIClient.complete(`
You are a professional translator. Please translate the following English text into Japanese within 300 characters.

${summary}

response:
    `.trim());
    return translatedSummary;
  } else {
    throw new Error("No summary found.");
  }
};
