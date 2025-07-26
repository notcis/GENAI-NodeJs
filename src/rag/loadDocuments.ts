import { Document } from "@langchain/core/documents";
import { crawlLangchainDocsUrls } from "./crawlDocuments";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import cliProgress from "cli-progress";

const progressBar = new cliProgress.SingleBar({});

export async function loadDocuments(): Promise<Document[]> {
  const langchainDocsUrls = await crawlLangchainDocsUrls();

  console.log(`Langchain Docs URLs: ${langchainDocsUrls.length}`);

  progressBar.start(langchainDocsUrls.length, 0);

  const rawDocments: Document[] = [];

  for (const url of langchainDocsUrls) {
    const loader = new CheerioWebBaseLoader(url);
    const docs = await loader.load();
    rawDocments.push(...docs); // Assuming we want the first document from each URL
    progressBar.increment();
  }
  progressBar.stop();
  console.log(`Loaded ${rawDocments.length} documents from Langchain Docs`);

  return rawDocments;
}

const main = async () => {
  try {
    const documents = await loadDocuments();
    console.log(`Total documents loaded: ${documents[0]?.pageContent}`);
  } catch (error) {
    console.error("Error loading documents:", error);
  }
};

/* main().catch((error) => {
  console.error("Error in main:", error);
  process.exit(1);
}); */
