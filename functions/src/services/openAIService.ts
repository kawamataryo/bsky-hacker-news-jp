import * as functions from "firebase-functions";
import { OpenAIClient } from "../clients/openAIClient";

export const getTranslatedSummaryFromUrl = async (url: string): Promise<string> => {
  const openAIClient = new OpenAIClient(functions.config().openai.api_key);
  const summary = await openAIClient.summarize(url);
  const translatedSummary = await openAIClient.complete(`
    translate from English to Japanese:
    ${summary}
    response:
    `.trim());
  return translatedSummary;
};
