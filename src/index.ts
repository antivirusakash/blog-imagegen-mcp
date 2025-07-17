import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { OpenAIImageClient, 
  SIZES, STYLES, RESPONSE_FORMATS, OUTPUT_FORMATS, MODERATION_LEVELS, BACKGROUNDS, QUALITIES } from "./libs/openaiImageClient.js";

import dotenv from "dotenv";
dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Allow server to start without API key for tool discovery (Smithery best practice)
let imageClient: OpenAIImageClient | null = null;

// Parse command line arguments for models
const args = process.argv.slice(2);
let allowedModels: string[] = [];

// Parse --models flag
const modelsIndex = args.indexOf('--models');
if (modelsIndex !== -1) {
  for (let i = modelsIndex + 1; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      break;
    }
    allowedModels.push(args[i]);
  }
}

// Initialize client only if API key is available
if (OPENAI_API_KEY) {
  imageClient = new OpenAIImageClient(OPENAI_API_KEY, allowedModels);
}

// Default model configurations for tool discovery
const DEFAULT_MODELS = ['gpt-image-1', 'dall-e-2', 'dall-e-3'];
const DEFAULT_MODEL = 'gpt-image-1';

/**
 * Helper function to convert object values to Zod enum
 */
function objectValuesToZodEnum<T extends string>(obj: Record<string, T>) {
  return Object.values(obj) as [T, ...T[]];
}

/**
 * Helper function to convert array to Zod enum
 */
function arrayToZodEnum<T extends string>(arr: T[]) {
  return arr as [T, ...T[]];
}

/**
 * Helper function to get available models for tool schemas
 */
function getAvailableModels(): string[] {
  return imageClient ? Object.values(imageClient.getAllowedModels()) : DEFAULT_MODELS;
}

/**
 * Helper function to get default model for tool schemas
 */
function getDefaultModel(): string {
  return imageClient ? imageClient.getDefaultModel() : DEFAULT_MODEL;
}

/**
 * Helper function to validate API key is available for tool execution
 */
function validateApiKey(): void {
  if (!OPENAI_API_KEY || !imageClient) {
    throw new Error("OpenAI API key is required. Please set the OPENAI_API_KEY environment variable.");
  }
}

const server = new McpServer({
  name: "OpenAI Image Generation MCP",
  version: "1.1.0"
});

// Text-to-image generation tool
server.tool("text-to-image",
  { 
    text: z.string().describe("The prompt to generate an image from"),
    outputPath: z.string().optional().describe("Absolute path or directory where the output file should be saved. Defaults to the current working directory."),
    model: z.enum(arrayToZodEnum(getAvailableModels())).optional().describe("The model to use").default(getDefaultModel()),
    size: z.enum(objectValuesToZodEnum(SIZES)).optional().describe("Size of the generated image").default(SIZES.S1024),
    style: z.enum(objectValuesToZodEnum(STYLES)).optional().describe("Style of the image (for dall-e-3)").default(STYLES.VIVID),
    output_format: z.enum(objectValuesToZodEnum(OUTPUT_FORMATS)).optional().describe("The format of the generated image").default(OUTPUT_FORMATS.WEBP),
    output_compression: z.number().min(0).max(100).optional().describe("The compression of the generated image").default(100),
    moderation: z.enum(objectValuesToZodEnum(MODERATION_LEVELS)).optional().describe("The moderation level of the generated image").default(MODERATION_LEVELS.LOW),
    quality: z.enum(objectValuesToZodEnum(QUALITIES)).optional().describe("The quality of the generated image").default(QUALITIES.STANDARD),
    n: z.number().min(1).max(10).optional().describe("The number of images to generate").default(1), 
  },
  async ({ text, model, size, style, output_format, output_compression, moderation, quality, n, outputPath }) => {
    try {
      // Validate API key is available (lazy loading)
      validateApiKey();
      
      // Validate and sanitize the prompt
      const sanitizedPrompt = imageClient!.validateAndSanitizePrompt(text);
      
      // Generate the image(s)
      const result = await imageClient!.generateImages({
        prompt: sanitizedPrompt,
        model: model as any,
        size: size as any,
        style: style as any,
        response_format: RESPONSE_FORMATS.B64_JSON,
        output_format: output_format as any,
        output_compression: output_compression as any,
        moderation: moderation as any,
        quality: quality as any,
        n: n as any
      });

      if (result.data.length === 0) {
        throw new Error("No images were generated");
      }

      // Handle multiple images
      const savedImages: string[] = [];
      for (let i = 0; i < result.data.length; i++) {
        const imageData = result.data[i].b64_json;
        if (!imageData) {
          throw new Error(`Image data not found in response at index ${i}`);
        }

        // Save each image to a file
        const filePath = imageClient!.saveImageToTempFile(imageData, output_format, outputPath);
        savedImages.push(filePath);
      }

      // Return the file path(s) - if single image, return just the path; if multiple, return array
      const responseText = savedImages.length === 1 ? savedImages[0] : savedImages.join('\n');

      return {
        content: [
          {
            type: "text",
            text: responseText
          }
        ]
      };
    } catch (error: unknown) {
      console.error("Error generating image:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        content: [
          { 
            type: "text", 
            text: `Error generating image: ${errorMessage}` 
          }
        ]
      };
    }
  }
);

// Image-to-image editing tool
server.tool("image-to-image",
  { 
    images: z.array(z.string()).describe("The images to edit. Must be an array of file paths."),
    prompt: z.string().describe("A text description of the desired image(s)"),
    outputPath: z.string().optional().describe("Absolute path or directory where the output file should be saved. Defaults to the current working directory."),
    mask: z.string().optional().describe("Optional mask image whose transparent areas indicate where image should be edited. Must be a file path."),
    model: z.enum(arrayToZodEnum(getAvailableModels())).optional().describe("The model to use. Only gpt-image-1 and dall-e-2 are supported.").default(getDefaultModel()),
    size: z.enum(objectValuesToZodEnum(SIZES)).optional().describe("Size of the generated image").default(SIZES.S1024),
    output_format: z.enum(objectValuesToZodEnum(OUTPUT_FORMATS)).optional().describe("The format of the generated image").default(OUTPUT_FORMATS.PNG),
    output_compression: z.number().min(0).max(100).optional().describe("The compression of the generated image").default(100),
    quality: z.enum(objectValuesToZodEnum(QUALITIES)).optional().describe("The quality of the generated image").default(QUALITIES.STANDARD),
    n: z.number().min(1).max(10).optional().describe("The number of images to generate").default(1),
  },
  async ({ images, prompt, mask, model, size, output_format, output_compression, quality, n, outputPath }) => {
    try {
      // Validate API key is available (lazy loading)
      validateApiKey();
      
      // Validate and sanitize the prompt
      const sanitizedPrompt = imageClient!.validateAndSanitizePrompt(prompt);
      
      // Validate input images exist
      for (const imagePath of images) {
        const fs = await import('fs');
        if (!fs.existsSync(imagePath)) {
          throw new Error(`Input image not found: ${imagePath}`);
        }
      }

      // Validate mask if provided
      if (mask) {
        const fs = await import('fs');
        if (!fs.existsSync(mask)) {
          throw new Error(`Mask image not found: ${mask}`);
        }
      }

      // Edit the image(s)
      const result = await imageClient!.editImages({
        images: images,
        prompt: sanitizedPrompt,
        mask,
        model: model as any,
        size: size as any,
        response_format: RESPONSE_FORMATS.B64_JSON,
        output_format: output_format as any,
        output_compression: output_compression as any,
        quality: quality as any,
        n: n as any
      });

      if (result.data.length === 0) {
        throw new Error("No images were generated");
      }

      // Handle multiple images
      const savedImages: string[] = [];
      for (let i = 0; i < result.data.length; i++) {
        const imageData = result.data[i].b64_json;
        if (!imageData) {
          throw new Error(`Image data not found in response at index ${i}`);
        }

        // Save each image to a file
        const filePath = imageClient!.saveImageToTempFile(imageData, output_format, outputPath);
        savedImages.push(filePath);
      }

      // Return the file path(s) - if single image, return just the path; if multiple, return array
      const responseText = savedImages.length === 1 ? savedImages[0] : savedImages.join('\n');

      return {
        content: [
          {
            type: "text",
            text: responseText
          }
        ]
      };
    } catch (error: unknown) {
      console.error("Error editing image:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        content: [
          { 
            type: "text", 
            text: `Error editing image: ${errorMessage}` 
          }
        ]
      };
    }
  }
);

/**
 * Start the MCP server
 * Wrapped in async function to avoid top-level await (required for CommonJS compatibility)
 */
async function startServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.log("OpenAI Image Generation MCP Server started successfully");
  console.log("Available models:", getAvailableModels());
  console.log("Default model:", getDefaultModel());
  if (OPENAI_API_KEY) {
    console.log("✅ OpenAI API key configured");
  } else {
    console.log("⚠️  OpenAI API key not configured - tools will require configuration before use");
  }
}

// Start the server and handle any errors
startServer().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});