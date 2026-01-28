import { FirestoreClient } from "../clients/firestoreClient";
import { HackerNewsClient } from "../clients/hackerNewsClient";
import { OpenAIClient } from "../clients/openAIClient";

const initializeClients = (secrets: Secrets) => {
  const hackerNewsClient = new HackerNewsClient();
  const fireStoreClient = new FirestoreClient();
  const openAIClient = new OpenAIClient(secrets.openai.api_key);

  return { hackerNewsClient, fireStoreClient, openAIClient };
};

const findValidStory = async (bestStories: number[], fireStoreClient: FirestoreClient, hackerNewsClient: HackerNewsClient) => {
  for (const storyId of bestStories) {
    if (!storyId) {
      throw new Error("Encountered an invalid story ID.");
    }

    const isPostedStory = await fireStoreClient.isPostedStory(storyId);

    if (isPostedStory) {
      continue;
    }

    const targetStory = await hackerNewsClient.getStory(storyId);

    if (targetStory && targetStory.url) {
      return targetStory;
    }
  }
  return null;
};

export const getTargetStory = async (secrets: Secrets): Promise<HackerNewsItemWithTranslated> => {
  const { hackerNewsClient, fireStoreClient, openAIClient } = initializeClients(secrets);
  const bestStories = await hackerNewsClient.getBestStories();
  const targetStory = await findValidStory(bestStories, fireStoreClient, hackerNewsClient);

  if (!targetStory) {
    throw new Error("No valid story found.");
  }
  const translatedTitle = await openAIClient.translateToJapanese(targetStory.title);

  return {
    ...targetStory,
    translatedTitle,
  };
};
