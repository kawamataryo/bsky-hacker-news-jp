import * as functions from "firebase-functions";
import { getTargetStory } from "../../services/hackerNewsService";
import { postNews, postSummaryOnThread } from "../../services/bskyService";
import { FirestoreClient } from "../../clients/firestoreClient";
import { getTranslatedSummaryFromUrl } from "../../services/openAIService";

const runtimeOpts = {
  timeoutSeconds: 180,
  memory: "512MB" as const,
};

export const post = functions
  .runWith(runtimeOpts)
  .https.onRequest(async (_req, res) => {
    const targetStory = await getTargetStory();
    const result = await postNews(targetStory);
    try {
      const summary = await getTranslatedSummaryFromUrl(targetStory.url!);
      await postSummaryOnThread(summary, {
        cid: result.cid,
        uri: result.uri,
      });
      await new FirestoreClient().insertPostedStory({
        ...targetStory,
        summary,
      });
      res.send(`✅ success: ${summary}`);
    } catch (e) {
      res.send({
        body: `🚨 error: ${e}`,
        statusCode: 500,
      });
    }
  });
