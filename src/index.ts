import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { OpenAIImageClient, SIZES, STYLES, OUTPUT_FORMATS, MODERATION_LEVELS, QUALITIES } from "./libs/openaiImageClient.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Clean, simple MCP server for OpenAI Image Generation
 * 
 * Smithery deployment-friendly features:
 * - No top-level await (CommonJS compatible)
 * - Lazy loading: tools discoverable without API key
 * - Proper error handling and validation
 * - TypeScript runtime configuration in smithery.yaml
 */
class ImageGenServer {
  private server: McpServer;
  private apiKey: string | null;
  private client: OpenAIImageClient | null = null;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || null;
    this.server = new McpServer({
      name: "OpenAI Image Generation MCP",
      version: "2.0.0"
    });

    // Initialize client if API key is available
    if (this.apiKey) {
      this.client = new OpenAIImageClient(this.apiKey);
    }

    this.setupTools();
  }

  /**
   * Setup MCP tools with lazy loading for Smithery deployment
   * Tools are registered even without API key for discovery
   */
  private setupTools(): void {
    // Get available models - fallback to standard models for discovery
    const availableModels = this.client ? 
      Object.values(this.client.getAllowedModels()) : 
      ['gpt-image-1', 'dall-e-2', 'dall-e-3'];
    
    const defaultModel = this.client ? 
      this.client.getDefaultModel() : 
      'gpt-image-1';

    // Text-to-image generation tool - available for discovery without API key
    this.server.tool("text-to-image", {
      text: z.string().describe("The prompt to generate an image from"),
      outputPath: z.string().optional().describe("Absolute path or directory where the output file should be saved. Defaults to the current working directory."),
      model: z.enum(availableModels as [string, ...string[]]).optional().describe("The model to use").default(defaultModel),
      size: z.enum(Object.values(SIZES) as [string, ...string[]]).optional().describe("Size of the generated image").default("1024x1024"),
      style: z.enum(Object.values(STYLES) as [string, ...string[]]).optional().describe("Style of the image (for dall-e-3)").default("vivid"),
      output_format: z.enum(Object.values(OUTPUT_FORMATS) as [string, ...string[]]).optional().describe("The format of the generated image").default("webp"),
      output_compression: z.number().min(0).max(100).optional().describe("The compression of the generated image").default(100),
      moderation: z.enum(Object.values(MODERATION_LEVELS) as [string, ...string[]]).optional().describe("The moderation level of the generated image").default("low"),
      quality: z.enum(Object.values(QUALITIES) as [string, ...string[]]).optional().describe("The quality of the generated image").default("standard"),
      n: z.number().min(1).max(10).optional().describe("The number of images to generate").default(1),
    }, async (args) => {
      return this.handleTextToImage(args);
    });

    // Image-to-image editing tool - available for discovery without API key
    this.server.tool("image-to-image", {
      images: z.array(z.string()).describe("The images to edit. Must be an array of file paths."),
      prompt: z.string().describe("A text description of the desired image(s)"),
      outputPath: z.string().optional().describe("Absolute path or directory where the output file should be saved. Defaults to the current working directory."),
      mask: z.string().optional().describe("Optional mask image whose transparent areas indicate where image should be edited. Must be a file path."),
      model: z.enum(availableModels as [string, ...string[]]).optional().describe("The model to use. Only gpt-image-1 and dall-e-2 are supported.").default(defaultModel),
      size: z.enum(Object.values(SIZES) as [string, ...string[]]).optional().describe("Size of the generated image").default("1024x1024"),
      output_format: z.enum(Object.values(OUTPUT_FORMATS) as [string, ...string[]]).optional().describe("The format of the generated image").default("png"),
      output_compression: z.number().min(0).max(100).optional().describe("The compression of the generated image").default(100),
      quality: z.enum(Object.values(QUALITIES) as [string, ...string[]]).optional().describe("The quality of the generated image").default("standard"),
      n: z.number().min(1).max(10).optional().describe("The number of images to generate").default(1),
    }, async (args) => {
      return this.handleImageToImage(args);
    });
  }

  /**
   * Handle text-to-image generation
   */
  private async handleTextToImage(args: any) {
    try {
      // Validate API key
      if (!this.apiKey || !this.client) {
        throw new Error("OpenAI API key is required. Please set the OPENAI_API_KEY environment variable.");
      }

      // Generate images
      const result = await this.client.generateImages({
        prompt: args.text,
        model: args.model,
        size: args.size,
        style: args.style,
        output_format: args.output_format,
        output_compression: args.output_compression,
        moderation: args.moderation,
        quality: args.quality,
        n: args.n,
      });

      if (result.data.length === 0) {
        throw new Error("No images were generated");
      }

      // Save images
      const savedImages: string[] = [];
      for (let i = 0; i < result.data.length; i++) {
        const imageData = result.data[i].b64_json;
        if (!imageData) {
          throw new Error(`Image data not found in response at index ${i}`);
        }

        const filePath = this.client.saveImageToTempFile(imageData, args.output_format, args.outputPath);
        savedImages.push(filePath);
      }

      const responseText = savedImages.length === 1 ? savedImages[0] : savedImages.join('\n');

      return {
        content: [
          {
            type: "text" as const,
            text: responseText
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error generating image: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }

  /**
   * Handle image-to-image editing
   */
  private async handleImageToImage(args: any) {
    try {
      // Validate API key
      if (!this.apiKey || !this.client) {
        throw new Error("OpenAI API key is required. Please set the OPENAI_API_KEY environment variable.");
      }

      // Validate image files exist
      const fs = await import('fs');
      for (const imagePath of args.images) {
        if (!fs.existsSync(imagePath)) {
          throw new Error(`Image file not found: ${imagePath}`);
        }
      }

      // Validate mask file if provided
      if (args.mask) {
        if (!fs.existsSync(args.mask)) {
          throw new Error(`Mask file not found: ${args.mask}`);
        }
      }

      // Edit images
      const result = await this.client.editImages({
        images: args.images,
        prompt: args.prompt,
        mask: args.mask,
        model: args.model,
        size: args.size,
        output_format: args.output_format,
        output_compression: args.output_compression,
        quality: args.quality,
        n: args.n,
      });

      if (result.data.length === 0) {
        throw new Error("No images were edited");
      }

      // Save images
      const savedImages: string[] = [];
      for (let i = 0; i < result.data.length; i++) {
        const imageData = result.data[i].b64_json;
        if (!imageData) {
          throw new Error(`Image data not found in response at index ${i}`);
        }

        const filePath = this.client.saveImageToTempFile(imageData, args.output_format, args.outputPath);
        savedImages.push(filePath);
      }

      const responseText = savedImages.length === 1 ? savedImages[0] : savedImages.join('\n');

      return {
        content: [
          {
            type: "text" as const,
            text: responseText
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error editing image: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.log("✅ OpenAI Image Generation MCP Server started successfully");
    console.log(`🔑 API Key: ${this.apiKey ? 'Configured' : 'Not configured'}`);
    
    if (!this.apiKey) {
      console.log("⚠️  Set OPENAI_API_KEY environment variable to enable image generation");
    }
  }
}

/**
 * Main function - no top-level await for CommonJS compatibility
 */
async function main() {
  try {
    const server = new ImageGenServer();
    await server.start();
  } catch (error) {
    console.error("❌ Failed to start MCP server:", error);
    process.exit(1);
  }
}

// Start the server
main();