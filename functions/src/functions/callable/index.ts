import * as functions from "firebase-functions";
import { getTargetStory } from "../../services/hackerNewsService";
import { postNews, postSummaryOnThread } from "../../services/bskyService";
import { FirestoreClient } from "../../clients/firestoreClient";
import { getTranslatedSummaryFromUrl } from "../../services/openAIService";

const runtimeOpts = {
  timeoutSeconds: 180,
  memory: "1GB" as const,
};

export const post = functions
  .runWith(runtimeOpts)
  .https.onRequest(async (_req, res) => {
    const targetStory = await getTargetStory();
    const result = await postNews(targetStory);

    const firestoreClient = new FirestoreClient();
    await firestoreClient.insertPostedStory(
      targetStory,
    );
    let summary = "";
    try {
      summary = await getTranslatedSummaryFromUrl(targetStory.url!);
      await postSummaryOnThread(summary, {
        cid: result.cid,
        uri: result.uri,
      });
      await firestoreClient.updatePostedStory(targetStory.id, summary);
      res.send(`✅ success: ${summary}`);
    } catch (e) {
      console.error(e);
      res.send({
        body: `🚨 error: ${e}`,
        statusCode: 500,
      });
    }
  });
