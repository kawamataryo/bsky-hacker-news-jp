import * as functions from "firebase-functions";
import { OpenAIClient } from "../clients/openAIClient";
import { timeoutPromise } from "../utils/utils";

export const getTranslatedSummaryFromUrl = async (url: string): Promise<string> => {
  const openAIClient = new OpenAIClient(functions.config().openai.api_key);
  const summary = await Promise.race([
    openAIClient.summarize(url),
    timeoutPromise(200000),
  ]);
  if (summary && summary.length < 5) {
    return summary;
  } else {
    throw new Error("No summary found.");
  }
};
