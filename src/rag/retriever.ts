import { VectorStoreRetriever } from "@langchain/core/vectorstores";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import dotenv from "dotenv";
dotenv.config();

export async function createRetriever(): Promise<VectorStoreRetriever> {
  // ตรวจสอบว่าตัวแปรสภาพแวดล้อมที่จำเป็นมีอยู่หรือไม่
  const embeddingsLLM = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
  });

  // เชื่อมต่อกับ Pinecone
  const pinecone = new PineconeClient();
  const pineconeIndex = pinecone.Index("coop-index");

  // ตรวจสอบว่าการเชื่อมต่อสำเร็จหรือไม่
  const vectorStore = await PineconeStore.fromExistingIndex(embeddingsLLM, {
    pineconeIndex,
  });

  return vectorStore.asRetriever();
}

async function main() {
  const retriever = await createRetriever();
  const context = await retriever.invoke("ขอเบอร์โทรติดต่อหน่อย");
  console.log(context); // แสดงผลลัพธ์ที่ได้จากการค้นหา
}

/* main().catch((error) => {
  console.error("Error creating retriever:", error);
  process.exit(1);
}); */
