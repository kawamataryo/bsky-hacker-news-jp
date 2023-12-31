import * as functions from "firebase-functions";
import { postNews, replyToPostPerText } from "../../services/bskyService";
import { FirestoreClient } from "../../clients/firestoreClient";
import { getTargetStory } from "../../services/hackerNewsService";
import { getTranslatedSummaryFromUrl } from "../../services/openAIService";

const runtimeOpts = {
  timeoutSeconds: 240,
  memory: "1GB" as const,
};

export const postTrend = functions
  .runWith(runtimeOpts)
  .pubsub.schedule("every 2 hours")
  .onRun(async () => {
    const targetStory = await getTargetStory();
    const result = await postNews(targetStory);

    const firestoreClient = new FirestoreClient();
    await firestoreClient.insertPostedStory(
      targetStory,
    );

    try {
      const summary = await getTranslatedSummaryFromUrl(targetStory.url!);
      await replyToPostPerText(summary, {
        cid: result.cid,
        uri: result.uri,
      });
      await firestoreClient.updatePostedStory(targetStory.id, summary);
    } catch (e) {
      console.error(e);
    }
  });
