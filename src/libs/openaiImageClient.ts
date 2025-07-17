import OpenAI from "openai";

export async function generateImage({
  prompt,
  openaiApiKey,
  n = 1,
  size = "1024x1024",
  model = "gpt-image-1",
}: {
  prompt: string;
  openaiApiKey: string;
  n?: number;
  size?: "256x256" | "512x512" | "1024x1024";
  model?: string;
}): Promise<string[]> {
  const openai = new OpenAI({ apiKey: openaiApiKey });

  const response = await openai.images.generate({
    model,
    prompt,
    n,
    size,
  });

  // The OpenAI SDK types are currently "unknown" here, so we narrow down to
  // the shape we care about (objects containing a possibly-undefined `url`).
  const images = (response.data ?? []) as Array<{ url?: string }>;

  // Extract URLs from the response, filtering out any undefined entries
  return images
    .map((img) => img.url)
    .filter((url): url is string => Boolean(url));
} 