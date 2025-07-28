import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";
import { createRetriever } from "./retriever";
import { RunnableSequence } from "@langchain/core/runnables";
import { formatDocumentsAsString } from "langchain/util/document";
import { chat, ChatHandler } from "../utils/chat";
import { BaseMessage, AIMessage, HumanMessage } from "@langchain/core/messages";
dotenv.config();

async function main() {
  // สร้าง prompt template สำหรับการถามตอบ
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "human",
      `You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Use three sentences maximum and keep the answer concise.
    Question: {question} 
    Context: {context} 
    Answer:`,
    ],
    new MessagesPlaceholder("chat_history"),
    ["human", "{question}"],
  ]);

  // สร้างโมเดล LLM ที่จะใช้ในการสร้างคำตอบ
  const llm = new ChatOpenAI({
    model: "gpt-4o",
    maxTokens: 500,
    temperature: 0.3,
    topP: 0.5,
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
      chat_history: (input) => input.chat_history,
    },
    prompt,
    llm,
    outputParser,
  ]);

  const qcSystemPrompt = `Given a chat history and the latest user question which might reference context in the chat history, formulate a standalone question which can be understood without the chat history. Do NOT answer the question, just reformulate it if needed and otherwise return it as is.`;

  const qcPrompt = ChatPromptTemplate.fromMessages([
    ["system", qcSystemPrompt],
    new MessagesPlaceholder("chat_history"),
    ["human", "{question}"],
  ]);

  const qcChain = RunnableSequence.from([qcPrompt, llm, outputParser]);

  const chatHistory: BaseMessage[] = [];

  // สร้าง handler สำหรับการตอบคำถาม
  const chatHandle: ChatHandler = async (question: string) => {
    let contextualizedQuestion = null;

    if (chatHistory.length > 0) {
      // ถ้ามีประวัติการสนทนา ให้ใช้โมเดลเพื่อสร้างคำถามใหม่ที่เข้าใจได้โดยไม่ต้องอิงจากประวัติ
      contextualizedQuestion = await qcChain.invoke({
        question,
        chat_history: chatHistory,
      });
      console.log("Contextualized Question:", contextualizedQuestion);
    }

    return {
      answer: generateChain.stream({
        question: contextualizedQuestion || question,
        chat_history: chatHistory,
      }),
      answerCallBack: async (answerText: string) => {
        // เพิ่มข้อความที่ตอบกลับจากโมเดลเข้าไปในประวัติการสนทนา
        chatHistory.push(new HumanMessage(contextualizedQuestion || question));
        chatHistory.push(new AIMessage(answerText));
      },
    };
  };

  // เรียกใช้ฟังก์ชัน chat เพื่อเริ่มต้นการสนทนา
  chat(chatHandle);
}

main().catch((error) => {
  console.error("Error during chat:", error);
  process.exit(1);
});
