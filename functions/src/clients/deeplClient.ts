import axios from "axios";

export class DeepLClient {
  apiKey: string;
  TRANSLATE_ENDPOINT = "https://api-free.deepl.com/v2/translate";

  constructor(deepLApiKey: string) {
    this.apiKey = deepLApiKey;
  }

  async translateJA(text: string) {
    const params = new URLSearchParams({
      auth_key: this.apiKey,
      text: text,
      source_lang: "EN",
      target_lang: "JA",
    });

    try {
      const response = await axios.post(`${this.TRANSLATE_ENDPOINT}?${params.toString()}`);
      return response.data.translations[0].text;
    } catch (error) {
      throw new Error(`Failed to translate ${error}`);
    }
  }
}
