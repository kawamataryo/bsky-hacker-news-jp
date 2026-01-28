
import sharp from "sharp";
import ogs from "open-graph-scraper";
import { BskyClient } from "../clients/bskyClient";
import { ComAtprotoRepoStrongRef } from "@atproto/api";
import { truncateText } from "../utils/utils";

export const getOgImageFromUrl = async (url: string): Promise<OpenGraph> => {
  const options = { url: url };
  const { result } = await ogs(options);
  const res = await fetch(result.ogImage?.at(0)?.url || "");

  // minify image size because of bsky.social's image size limit
  const buffer = await res.arrayBuffer();
  const compressedImage = await sharp(buffer)
    .resize(800, null, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({
      quality: 80,
      progressive: true,
    })
    .toBuffer();

  return {
    url: result.ogImage?.at(0)?.url || "",
    type: result.ogImage?.at(0)?.type || "",
    description: result.ogDescription || "",
    title: result.ogTitle || "",
    uint8Array: new Uint8Array(compressedImage),
  };
};


export const createPostText = (item: HackerNewsItemWithTranslated): string => {
  return `
${item.translatedTitle}
${item.title}

🔺 ${item.score.toLocaleString()}
💬 ${item.kids.length.toLocaleString()}
🔗 [HN Post](https://news.ycombinator.com/item?id=${item.id}) | [Article](${item.url})
`.trim();
};

export const postNews = async (item: HackerNewsItemWithTranslated, secrets: Secrets) => {
  const agent = await BskyClient.createAgent({
    identifier: secrets.bsky.identifier,
    password: secrets.bsky.password,
  });
  const { text, facets } = convertLinkText(createPostText(item));

  let og: OpenGraph | null = null;
  try {
    og = await getOgImageFromUrl(item.url!);
  } catch (e) {
    console.error(e);
  }

  if (og) {
    const uploadedImage = await agent.uploadImage({
      image: og.uint8Array,
      encoding: "image/jpeg",
    });

    return await agent.post({
      text,
      facets,
      embed: {
        $type: "app.bsky.embed.external",
        external: {
          uri: item.url,
          thumb: {
            $type: "blob",
            ref: {
              $link: uploadedImage.$link,
            },
            mimeType: uploadedImage.mimeType,
            size: uploadedImage.size,
          },
          title: og.title,
          description: og.description,
        },
      },
    });
  } else {
    return await agent.post({
      text,
      facets,
    });
  }
};

export const postSummaryOnThread = async (summary: string, postRef: ComAtprotoRepoStrongRef.Main, secrets: Secrets) => {
  const agent = await BskyClient.createAgent({
    identifier: secrets.bsky.identifier,
    password: secrets.bsky.password,
  });
  agent.post({
    text: truncateText(`💡 Summary: \n\n${summary}`, 300),
    reply: {
      root: postRef,
      parent: postRef,
    },
  });
};

// ref https://zenn.dev/kawarimidoll/articles/42efe3f1e59c13
export const convertLinkText = (src: string) => {
  const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/;
  const facets = [];

  while (src.match(mdLinkRegex)) {
    const links = src.match(mdLinkRegex);
    if (!links) break;
    const [matched, anchor, uri] = links;
    src = src.replace(matched, anchor);

    const byteStart = new TextEncoder().encode(
      src.substring(0, links.index)
    ).byteLength;
    const byteEnd = byteStart + new TextEncoder().encode(anchor).byteLength;

    facets.push({
      index: { byteStart, byteEnd },
      features: [{ $type: "app.bsky.richtext.facet#link", uri }],
    });
  }
  return { text: src, facets };
};

export const splitStringForThreadText = (text: string, limit: number) => {
  const splitJapaneseText = (jpnText: string) => {
    // 「。」「、」で分割して配列に格納し、区切り文字を前の要素に含める
    const items = jpnText.split(/([。、])/);

    const sentences = items.reduce<string[]>((result, item, index) => {
      if (index % 2 === 0 && index + 1 < items.length) {
        result.push(item + items[index + 1]);
      }
      return result;
    }, []);

    // 空の要素と区切り文字のみの要素を削除
    return sentences.filter((sentence: string) =>
      sentence.trim().length > 0 && sentence !== "。" && sentence !== "、"
    );
  };

  const words = splitJapaneseText(text);
  const chunks = [];
  let currentChunk = "";

  words.forEach((word) => {
    if ((currentChunk + word).length <= limit - 5) {
      currentChunk += word;
    } else {
      chunks.push(currentChunk.trim());
      currentChunk = word;
    }
  });

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  const total = chunks.length;
  if (total === 1) return chunks;
  return chunks.map((chunk, index) => `${chunk} (${index + 1}/${total})`);
};

export const replyToPostPerText = async (text: string, rootPostRef: ComAtprotoRepoStrongRef.Main, secrets: Secrets) => {
  const agent = await BskyClient.createAgent({
    identifier: secrets.bsky.identifier,
    password: secrets.bsky.password,
  });

  const treadTexts = splitStringForThreadText(`💡 Summary: \n\n${text}`, 300);
  let targetPostRef = rootPostRef;

  for (const text of treadTexts) {
    const result = await agent.post({
      text,
      reply: {
        root: rootPostRef,
        parent: targetPostRef,
      },
    });
    targetPostRef = result;
  }
};
