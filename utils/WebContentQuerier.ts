// utils/WebContentQuerier.ts
import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import puppeteer from 'puppeteer-core';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';


// Load environment variables
dotenv.config();

export class WebContentQuerier {
  private model: ChatOpenAI;
  private embeddings: OpenAIEmbeddings;
  private vectorStore: MemoryVectorStore | null;

  constructor() {
    // Initialize OpenAI model and embeddings
    this.model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.7,
      model: 'gpt-3.5-turbo',
    });

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    this.vectorStore = null;
  }

  async extractWebPageContent(url: string) {
    const BROWSER_WS = process.env.BROWSER_WS; // Scraping browser WebSocket URL

    if (!BROWSER_WS) {
      throw new Error("Scraping browser WebSocket URL is not defined in .env file.");
    }

    try {
      console.log('Connecting to Scraping Browser...');
      
      // Connect to the Scraping Browser
      const browser = await puppeteer.connect({
        browserWSEndpoint: BROWSER_WS,
      });

      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(60000);
      console.log(`Navigating to URL: ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

      // Extract the content
      const html = await page.content();

      // Use Cheerio to parse the HTML
      const $ = cheerio.load(html);
      const pageText = $('body').text()
        .replace(/\s+/g, ' ')
        .trim();

      // Create a document-like object
      const docs = [{
        pageContent: pageText,
        metadata: { source: url }
      }];

      // Split the document into smaller chunks
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const splitDocs = await textSplitter.splitDocuments(docs);

      // Create vector store in memory
      this.vectorStore = await MemoryVectorStore.fromDocuments(
        splitDocs,
        this.embeddings
      );

      console.log(`Successfully extracted and indexed content from ${url}`);
      await browser.close();
      return splitDocs.length;
    } catch (error) {
      console.error('Error extracting web page content:', error);
      throw error;
    }
  }

  async queryContent(query: string, maxResults: number = 4) {
    if (!this.vectorStore) {
      throw new Error(
        'No content has been loaded. Call extractWebPageContent first.'
      );
    }

    try {
      // Perform similarity search
      const relevantDocs = await this.vectorStore.similaritySearch(
        query,
        maxResults
      );

      // Use the relevant documents as context for the query
      const context = relevantDocs.map((doc) => doc.pageContent).join('\n\n');

      // Create chat messages with system and human messages
      const messages = [
        new SystemMessage(
          'You are a helpful assistant that answers questions based strictly on the given context.'
        ),
        new HumanMessage(
          `Context:\n${context}\n\nQuery: ${query}\n\nProvide a concise and accurate answer based strictly on the context.`
        ),
      ];

      // Generate an answer using the chat messages
      const response = await this.model.invoke(messages);

      return {
        answer: response.content,
        context: relevantDocs,
      };
    } catch (error) {
      console.error('Error querying content:', error);
      throw error;
    }
  }

  // Optional method to clear the vector store
  clearContent() {
    this.vectorStore = null;
    console.log('Vector store cleared');
  }
}

export default WebContentQuerier;