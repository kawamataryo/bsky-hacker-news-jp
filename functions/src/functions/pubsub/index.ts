import * as functions from "firebase-functions/v1";
import { postNews, replyToPostPerText } from "../../services/bskyService";
import { FirestoreClient } from "../../clients/firestoreClient";
import { getTargetStory } from "../../services/hackerNewsService";
import { getTranslatedSummaryFromUrl } from "../../services/openAIService";
import { SECRETS } from "../../utils/firebaseConfig";

const runtimeOpts = {
  timeoutSeconds: 240,
  memory: "1GB" as const,
  secrets: [SECRETS],
};

export const postTrend = functions
  .runWith(runtimeOpts)
  .pubsub.schedule("every 2 hours")
  .onRun(async () => {
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
    } catch (e) {
      console.error(e);
    }
  });
