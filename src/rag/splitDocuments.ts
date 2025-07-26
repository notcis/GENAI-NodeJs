import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { loadDocuments } from "./loadDocuments";

export async function splitDocuments(
  rawDocuments: Document[]
): Promise<Document[]> {
  console.log(`Splitting documents into chunks...`);

  // Ensure that rawDocuments is an array of Document objects
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 50,
  });

  // Split the documents into chunks
  const documentChunks = await splitter.splitDocuments(rawDocuments);

  console.log(`Total chunks created: ${documentChunks.length}`);

  return documentChunks;
}

const main = async () => {
  const rawDocuments = await loadDocuments(); // Assuming loadDocuments is imported from loadDocuments.ts
  await splitDocuments(rawDocuments);
};

/* main().catch((error) => {
  console.error("Error in main:", error);
  process.exit(1);
});
 */
