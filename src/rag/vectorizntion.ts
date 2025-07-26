import dotenv from "dotenv";
import { loadDocuments } from "./loadDocuments";
import { splitDocuments } from "./splitDocuments";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import cliProgress from "cli-progress";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";

dotenv.config();

async function main() {
  //const rawDocuments = await loadDocuments();

  // 1. โหลดเอกสารจาก URL โดยใช้ CheerioWebBaseLoader
  const loader = new CheerioWebBaseLoader("https://line.coopmsds.com/loan", {
    selector: ".wrapper",
  });

  // 2. โหลดเอกสาร (ได้กลับมาเป็น Document[])
  const docs = await loader.load();

  // 2. แบ่งเอกสารเป็นชิ้นเล็ก ๆ (chunks) โดยใช้ splitDocuments
  const chunkedDocuments = await splitDocuments(docs);

  // 3. สร้าง embeddings ด้วย OpenAIEmbeddings
  const embeddingsLLM = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
  });

  // 4. เชื่อมต่อกับ Pinecone
  const pinecone = new PineconeClient();
  const pineconeIndex = pinecone.Index("coop-index");

  console.log("Connecting to Pinecone...");
  const progressBar = new cliProgress.SingleBar({});
  progressBar.start(chunkedDocuments.length, 0);

  // 5. Vectorize และเก็บเอกสารใน Pinecone
  for (let i = 0; i < chunkedDocuments.length; i = i + 100) {
    const batch = chunkedDocuments.slice(i, i + 100);
    await PineconeStore.fromDocuments(batch, embeddingsLLM, {
      pineconeIndex,
    });
    progressBar.increment(batch.length);
  }

  progressBar.stop();
  console.log("Documents vectorized and stored in Pinecone successfully.");
}

/* main().catch((error) => {
  console.error("Error during vectorization:", error);
  process.exit(1);
}); */
