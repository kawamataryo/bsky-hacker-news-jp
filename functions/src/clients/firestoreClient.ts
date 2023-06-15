import * as admin from "firebase-admin";
export class FirestoreClient {
  db: FirebaseFirestore.Firestore;
  postedStoriesCollectionRef: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>;
  constructor() {
    this.db = admin.firestore();
    this.postedStoriesCollectionRef = this.db.collection("v1").doc("postedStories").collection("stories");
  }
  async insertPostedStory(story: HackerNewsItemWithTranslated): Promise<void> {
    await this.postedStoriesCollectionRef.doc(story.id.toString()).set({
      ...story,
      createdAt: new Date().toISOString(),
    });
  }

  async updatePostedStory(id: number, summary: string): Promise<void> {
    await this.postedStoriesCollectionRef.doc(id.toString()).update({
      summary,
    });
  }

  async isPostedStory(storyId: number): Promise<boolean> {
    const doc = await this.postedStoriesCollectionRef.doc(storyId.toString()).get();
    return doc.exists;
  }
}
