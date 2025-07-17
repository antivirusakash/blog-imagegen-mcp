import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { generateImage } from "./libs/openaiImageClient.js";

// ---------------------------------------------------------------------------
// Configuration schema
// ---------------------------------------------------------------------------
// Users will supply these values in their Smithery *session* or *project*
// configuration. The schema enforces required fields and exposes helpful
// descriptions in the Smithery UI.
export const configSchema = z.object({
  openaiApiKey: z.string().describe("OpenAI API key"),
  defaultSize: z
    .enum(["256x256", "512x512", "1024x1024"])
    .default("1024x1024")
    .describe("Default image size for generation. Must be one of the allowed values."),
  defaultN: z
    .number()
    .int()
    .min(1)
    .max(4)
    .default(1)
    .describe("Default number of images to generate (1-4)."),
});

// ---------------------------------------------------------------------------
// MCP server factory
// ---------------------------------------------------------------------------
// The default export must be a function returning an `McpServer` instance that
// has all of our tools registered. Smithery will invoke this factory at boot.
export default function ({
  config,
}: {
  config: z.infer<typeof configSchema>;
}) {
  const server = new McpServer({
    name: "OpenAI Image Generator",
    version: "1.0.0",
  });

  // -------------------------------------------------------------------------
  // Tool: generate_image
  // -------------------------------------------------------------------------
  // A single tool that proxies prompts to OpenAI's "gpt-image-1" model and
  // returns the generated image URLs.
  server.tool(
    "generate_image",
    "Generate image(s) using OpenAI's gpt-image-1 model.",
    {
      prompt: z.string().describe("Text prompt for the image."),
      n: z
        .number()
        .int()
        .min(1)
        .max(4)
        .optional()
        .describe("Number of images to generate (1-4)."),
      size: z
        .enum(["256x256", "512x512", "1024x1024"])
        .optional()
        .describe("Size of the generated images."),
    },
    async ({
      prompt,
      n,
      size,
    }: {
      prompt: string;
      n?: number;
      size?: "256x256" | "512x512" | "1024x1024";
    }) => {
      const images = await generateImage({
        prompt,
        openaiApiKey: config.openaiApiKey,
        n: n ?? config.defaultN,
        size: (size ?? config.defaultSize) as any,
      });

      // The SDK currently requires `data`+`mimeType` for image content, which
      // we aren't producing here. Instead, respond with simple text links to
      // the generated images so users can click/open them.
      return {
        content: images.map((url) => ({
          type: "text",
          text: url,
        })),
      } as const;
    }
  );

  return server.server;
} 