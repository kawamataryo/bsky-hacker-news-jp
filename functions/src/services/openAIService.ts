import { OpenAIClient } from "../clients/openAIClient";
import { timeoutPromise } from "../utils/utils";

export const getTranslatedSummaryFromUrl = async (url: string, secrets: Secrets): Promise<string> => {
  const openAIClient = new OpenAIClient(secrets.openai.api_key);
  const summary = await Promise.race([
    openAIClient.summarize(url),
    timeoutPromise<string>(230000),
  ]);
  if (summary && summary.length > 10) {
    // summarizeが直接日本語要約を返すため、翻訳は不要
    return summary;
  } else {
    throw new Error("No summary found.");
  }
};
