import { z } from "zod";
import { hackerNewsItemSchema } from "../utils/zodSchema";
import axios from "axios";

export class HackerNewsClient {
  private BEST_STORIES_URL = "https://hacker-news.firebaseio.com/v0/beststories.json";
  private STORY_URL = "https://hacker-news.firebaseio.com/v0/item";

  async getStory(id: number): Promise<z.infer<typeof hackerNewsItemSchema>> {
    const res = await axios.get(`${this.STORY_URL}/${id}.json`);
    if (res.status === 200) {
      const json = res.data;
      return hackerNewsItemSchema.parse(json);
    } else {
      throw new Error(`Failed to fetch story ${id}`);
    }
  }

  async getBestStories(): Promise<number[]> {
    const res = await axios.get(this.BEST_STORIES_URL);
    if (res.status === 200) {
      const json = res.data;
      return z.array(z.number()).parse(json);
    } else {
      throw new Error("Failed to fetch best stories");
    }
  }
}
