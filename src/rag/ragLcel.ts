import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";
import { createRetriever } from "./retriever";
import { RunnableSequence } from "@langchain/core/runnables";
import { formatDocumentsAsString } from "langchain/util/document";
import { chat, ChatHandler } from "../utils/chat";
dotenv.config();

async function main() {
  // สร้าง prompt template สำหรับการถามตอบ
  const prompt = ChatPromptTemplate.fromMessages([
    "human",
    `You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Use three sentences maximum and keep the answer concise.
    Question: {question} 
    Context: {context} 
    Answer:`,
  ]);

  // สร้างโมเดล LLM ที่จะใช้ในการสร้างคำตอบ
  const llm = new ChatOpenAI({
    model: "gpt-4o",
    maxTokens: 500,
  });

  // สร้าง output parser เพื่อจัดการผลลัพธ์ที่ได้จาก LLM
  const outputParser = new StringOutputParser();

  // สร้าง retriever ที่จะใช้ในการดึงข้อมูลจาก Pinecone
  const retriever = await createRetriever();

  // สร้าง retrieval chain ที่จะใช้ในการดึงข้อมูลจาก retriever
  const retrievalChain = RunnableSequence.from([
    (input) => input.question,
    retriever,
    formatDocumentsAsString,
  ]);

  // สร้าง chain ที่รวม prompt, retriever และ LLM
  const generateChain = RunnableSequence.from([
    {
      question: (input) => input.question,
      context: retrievalChain,
    },
    prompt,
    llm,
    outputParser,
  ]);

  // สร้าง handler สำหรับการตอบคำถาม
  const chatHandle: ChatHandler = async (question: string) => {
    return {
      answer: generateChain.stream({
        question,
      }),
    };
  };

  // เรียกใช้ฟังก์ชัน chat เพื่อเริ่มต้นการสนทนา
  chat(chatHandle);
}

main().catch((error) => {
  console.error("Error during chat:", error);
  process.exit(1);
});
