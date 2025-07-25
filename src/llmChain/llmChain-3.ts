import { PromptTemplate } from "@langchain/core/prompts";
import dotenv from "dotenv";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { BedrockChat } from "@langchain/community/chat_models/bedrock";

dotenv.config();

async function personalisedPitch(
  course: string,
  role: string,
  wordLimit: number
) {
  // Create a prompt template for the personalised pitch
  const promptTemplate = new PromptTemplate({
    template: "อธิบาย {course} สำหรับ {role}. จำกัดผลลัพธ์ที่ {wordLimit} คำ.",
    inputVariables: ["course", "role", "wordLimit"],
  });

  // Format the prompt with the provided variables
  const response = await promptTemplate.format({
    course,
    role,
    wordLimit,
  });
  console.log(`prompt: ${response}`);

  // Initialize the ChatOpenAI model
  const llm = new BedrockChat({
    model: "anthropic.claude-v2",
    maxTokens: 200,
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  // Create an output parser to handle the response format
  const outputParser = new StringOutputParser();

  //const lcelChain = promptTemplate.pipe(llm).pipe(outputParser);

  // Create the LLMChain with the prompt template and output parser
  const lcelChain = RunnableSequence.from([promptTemplate, llm, outputParser]);

  // Invoke the LLMChain with the formatted response
  const lcelResponse = await lcelChain.invoke({
    course,
    role,
    wordLimit,
  });
  console.log(`LCEL Response: ${lcelResponse}`);
}

personalisedPitch("php", "backend developer", 150)
  .then(() => console.log("Done"))
  .catch((error) => console.error("Error:", error));
