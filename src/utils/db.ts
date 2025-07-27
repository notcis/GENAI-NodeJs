import mysql from "mysql2/promise";
import { BaseMessage, AIMessage, HumanMessage } from "@langchain/core/messages";

import dotenv from "dotenv";
dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
};

export class ChatHistoryManager {
  private pool: mysql.Pool;

  constructor() {
    this.pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  // เก็บ chat history ลงฐานข้อมูล
  async saveChatHistory(
    lineUserId: string,
    messages: BaseMessage[]
  ): Promise<void> {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      // ลบประวัติเก่าของ user นี้ (ถ้าต้องการเก็บแค่ session ปัจจุบัน)
      await connection.execute(
        "DELETE FROM chat_history WHERE line_user_id = ?",
        [lineUserId]
      );

      // เก็บ messages ใหม่
      for (const message of messages) {
        const messageType = message instanceof HumanMessage ? "human" : "ai";
        await connection.execute(
          "INSERT INTO chat_history (line_user_id, message_type, message_content) VALUES (?, ?, ?)",
          [lineUserId, messageType, message.content]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ดึง chat history จากฐานข้อมูล
  async getChatHistory(lineUserId: string): Promise<BaseMessage[]> {
    const connection = await this.pool.getConnection();

    try {
      const [rows] = (await connection.execute(
        "SELECT message_type, message_content FROM chat_history WHERE line_user_id = ? ORDER BY created_at ASC",
        [lineUserId]
      )) as [any[], any];

      return rows.map((row) => {
        if (row.message_type === "human") {
          return new HumanMessage(row.message_content);
        } else {
          return new AIMessage(row.message_content);
        }
      });
    } finally {
      connection.release();
    }
  }

  // เพิ่มข้อความใหม่เข้าไปในประวัติ
  async addMessage(lineUserId: string, message: BaseMessage): Promise<void> {
    const connection = await this.pool.getConnection();

    try {
      const messageType = message instanceof HumanMessage ? "human" : "ai";
      await connection.execute(
        "INSERT INTO chat_history (line_user_id, message_type, message_content) VALUES (?, ?, ?)",
        [lineUserId, messageType, message.content]
      );
    } finally {
      connection.release();
    }
  }

  // ลบประวัติการสนทนาของ user
  async clearChatHistory(lineUserId: string): Promise<void> {
    const connection = await this.pool.getConnection();

    try {
      await connection.execute(
        "DELETE FROM chat_history WHERE line_user_id = ?",
        [lineUserId]
      );
    } finally {
      connection.release();
    }
  }
}
