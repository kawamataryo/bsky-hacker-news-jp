import { OpenAI } from "langchain/llms/openai";
import { loadSummarizationChain } from "langchain/chains";
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";
import { PromptTemplate } from "langchain/prompts";

export class OpenAIClient {
  private model: OpenAI;

  constructor(openAIApiKey: string) {
    this.model = new OpenAI({ openAIApiKey, temperature: 0, modelName: "gpt-3.5-turbo" });
  }

  async complete(prompt: string) {
    return await this.model.call(prompt);
  }

  async summarize(url: string) {
    const prompt = new PromptTemplate({
      template: "以下の文章を要約してください。\n\n---\n{text}---\n\n要約:",
      inputVariables: ["text"],
    });
    const summarizationChain = loadSummarizationChain(this.model, {
      combineMapPrompt: prompt,
      combinePrompt: prompt,
      type: "map_reduce",
    });
    const docs = await this.getWebpageTextDocs(url);

    try {
      const res = await summarizationChain.call({
        input_documents: docs,
      });
      return res.text;
    } catch (e) {
      console.error(e);
      return "";
    }
  }

  private async getWebpageTextDocs(url: string) {
    const loader = new PuppeteerWebBaseLoader(url, {
      launchOptions: {
        headless: true,
        args: ["--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"],
      },
      gotoOptions: {
        waitUntil: "domcontentloaded",
      },
      async evaluate(page) {
        const result = await page.evaluate(async () => {
          // wait page load
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // remove unnecessary elements
          const scripts = document.body.querySelectorAll("script");
          const noscript = document.body.querySelectorAll("noscript");
          const styles = document.body.querySelectorAll("style");
          const scriptAndStyle = [...scripts, ...noscript, ...styles];
          scriptAndStyle.forEach((e) => e.remove());

          // collect text
          const mainElement = document.querySelector("main");
          return mainElement ? mainElement.innerText : document.body.innerText;
        });
        return result;
      },
    });
    return await loader.loadAndSplit();
  }
}
