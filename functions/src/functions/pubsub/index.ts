import * as functions from "firebase-functions";
import { postNews, postSummaryOnThread } from "../../services/bskyService";
import { FirestoreClient } from "../../clients/firestoreClient";
import { getTargetStory } from "../../services/hackerNewsService";
import { getTranslatedSummaryFromUrl } from "../../services/openAIService";

const runtimeOpts = {
  timeoutSeconds: 180,
  memory: "512MB" as const,
};

export const postTrend = functions
  .runWith(runtimeOpts)
  .pubsub.schedule("every 1 hours")
  .onRun(async () => {
    const targetStory = await getTargetStory();
    const result = await postNews(targetStory);
    let summary = "";
    try {
      summary = await getTranslatedSummaryFromUrl(targetStory.url!);
      await postSummaryOnThread(summary, {
        cid: result.cid,
        uri: result.uri,
      });
    } catch (e) {
      console.error(e);
    } finally {
      await new FirestoreClient().insertPostedStory({
        ...targetStory,
        summary,
      });
    }
  });
