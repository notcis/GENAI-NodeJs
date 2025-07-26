import dotenv from "dotenv";
import { OpenAIEmbeddings } from "@langchain/openai";

dotenv.config();

async function main() {
  const embeddingsLLM = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
  });

  const embeddings = await embeddingsLLM.embedQuery(
    "how many time to exercise in a week to get fit?"
  );

  console.log(`Embeddings: ${embeddings}`);

  console.log(`Embeddings length: ${embeddings.length}`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
