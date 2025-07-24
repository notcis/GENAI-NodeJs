import dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";

dotenv.config();

const llm = new ChatOpenAI({
  model: "gpt-4o",
});

const main = async () => {
  const response = await llm.invoke("best stocks to buy right now");

  console.log(`Response: ${response.content}`);
};

main()
  .then(() => console.log("Done"))
  .catch((error) => console.error("Error:", error));
