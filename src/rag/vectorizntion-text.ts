import dotenv from "dotenv";
import { splitDocuments } from "./splitDocuments";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import cliProgress from "cli-progress";
import { TextLoader } from "langchain/document_loaders/fs/text";

dotenv.config();

async function main() {
  //const rawDocuments = await loadDocuments();

  // 1. โหลดเอกสารจาก URL โดยใช้ CheerioWebBaseLoader
  const loader = new TextLoader("coop_content_new.txt");

  // 2. โหลดเอกสาร (ได้กลับมาเป็น Document[])
  const docs = await loader.load();

  console.log(docs);

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
    const batch = chunkedDocuments;
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
