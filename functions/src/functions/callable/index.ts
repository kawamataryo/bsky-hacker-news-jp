import * as functions from "firebase-functions/v1";
import { getTargetStory } from "../../services/hackerNewsService";
import { postNews, replyToPostPerText } from "../../services/bskyService";
import { FirestoreClient } from "../../clients/firestoreClient";
import { getTranslatedSummaryFromUrl } from "../../services/openAIService";
import { SECRETS } from "../../utils/firebaseConfig";

const runtimeOpts = {
  timeoutSeconds: 180,
  memory: "1GB" as const,
  secrets: [SECRETS],
};

export const post = functions
  .runWith(runtimeOpts)
  .https.onRequest(async (_req, res) => {
    const secrets = SECRETS.value();
    const targetStory = await getTargetStory(secrets);
    const result = await postNews(targetStory, secrets);

    const firestoreClient = new FirestoreClient();
    await firestoreClient.insertPostedStory(
      targetStory,
    );
    try {
      const summary = await getTranslatedSummaryFromUrl(targetStory.url!, secrets);
      await replyToPostPerText(summary, {
        cid: result.cid,
        uri: result.uri,
      }, secrets);
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
