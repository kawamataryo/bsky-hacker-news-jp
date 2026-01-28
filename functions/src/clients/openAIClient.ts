import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import puppeteer from "puppeteer";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

const DOCUMENT_MAX_LENGTH = 20000;

export class OpenAIClient {
  private openai: ReturnType<typeof createOpenAI>;

  constructor(openAIApiKey: string) {
    this.openai = createOpenAI({ apiKey: openAIApiKey });
  }

  async translateToJapanese(text: string): Promise<string> {
    try {
      const { text: translatedText } = await generateText({
        model: this.openai("gpt-5-nano"),
        system:
          "あなたは優秀な翻訳者です。与えられた英語のテキストを自然な日本語に翻訳してください。翻訳結果のみを出力し、説明や注釈は不要です。",
        prompt: text,
      });
      console.info("🚀 ~ translate result", translatedText);
      return translatedText.trim();
    } catch (e) {
      console.error(e);
      return text; // 翻訳失敗時は元のテキストを返す
    }
  }

  async summarize(url: string): Promise<string> {
    const content = await this.getArticleContent(url);
    if (!content || content.length < 30) {
      return "";
    }

    try {
      const { text } = await generateText({
        model: this.openai("gpt-5-nano"),
        system:
          "あなたはプロの要約者です。以下の記事を日本語で1-3文で簡潔に要約してください。",
        prompt: content.slice(0, DOCUMENT_MAX_LENGTH),
        providerOptions: {
          openai: {
            reasoningEffort: "minimal",
          },
        },
      });
      console.info("🚀 ~ summarize result", text);
      return text;
    } catch (e) {
      console.error(e);
      return "";
    }
  }

  private async getArticleContent(url: string): Promise<string> {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto(url, { waitUntil: "domcontentloaded" });

      // ページの読み込みを待つ
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // HTMLを取得
      const html = await page.content();

      // Readabilityで本文を抽出
      const dom = new JSDOM(html, { url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (article && article.textContent) {
        return article.textContent;
      }

      // Readabilityで抽出できない場合はフォールバック
      const fallbackText = await page.evaluate(() => {
        const scripts = document.body.querySelectorAll("script");
        const noscript = document.body.querySelectorAll("noscript");
        const styles = document.body.querySelectorAll("style");
        [...scripts, ...noscript, ...styles].forEach((e) => e.remove());

        const mainElement = document.querySelector("main");
        return mainElement ? mainElement.innerText : document.body.innerText;
      });

      return fallbackText;
    } finally {
      await browser.close();
    }
  }
}
