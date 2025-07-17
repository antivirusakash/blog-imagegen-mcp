# Smithery Deployment Guide

This guide explains how to deploy the OpenAI Image Generation MCP Server to Smithery.

## Prerequisites

1. **GitHub Repository**: Your code must be in a GitHub repository
2. **Smithery Account**: Create an account at [smithery.ai](https://smithery.ai)
3. **OpenAI API Key**: Required for image generation functionality

## Deployment Steps

### 1. Prepare Your Repository

Ensure your repository contains:
- `smithery.yaml` - Smithery configuration file
- `package.json` - Node.js package configuration
- `tsconfig.json` - TypeScript configuration
- `src/` directory with your TypeScript source code

### 2. Configuration Files

#### smithery.yaml
```yaml
runtime: "typescript"
```

#### package.json
Your package.json should include:
- Proper `main` entry point (`dist/index.js`)
- **Required**: `module` field pointing to TypeScript source (`./src/index.ts`)
- Build script (`npm run build`)
- MCP server configuration in the `mcp` section

### 3. Deploy to Smithery

1. **Connect GitHub**: Link your GitHub account to Smithery
2. **Import Repository**: Import your MCP server repository
3. **Configure Environment**: Set up the `OPENAI_API_KEY` environment variable
4. **Deploy**: Click the Deploy button in the Smithery dashboard

### 4. Environment Variables

Set the following environment variables in Smithery:

- `OPENAI_API_KEY`: Your OpenAI API key (required for image generation)

### 5. Testing

After deployment, you can test your MCP server using:

1. **Smithery Playground**: Use the built-in testing interface
2. **MCP Clients**: Connect using the provided connection URL
3. **Command Line**: Use the Smithery CLI to test locally

## Features

### Tool Discovery (Lazy Loading)

The server implements Smithery's recommended "lazy loading" pattern:

- Tools are listed without requiring authentication
- API keys are only validated when tools are actually invoked
- This allows users to discover capabilities before configuration

### Supported Tools

1. **text-to-image**: Generate images from text prompts
2. **image-to-image**: Edit existing images with text prompts

### Supported Models

- `gpt-image-1` (default)
- `dall-e-3`
- `dall-e-2`

## Configuration Options

### Image Generation Parameters

- **Size**: Various aspect ratios (1024x1024, 1792x1024, etc.)
- **Quality**: standard, hd, low, medium, high
- **Format**: PNG, JPEG, WebP
- **Style**: vivid, natural (DALL-E 3 only)
- **Moderation**: low, auto

### Output Management

- Configurable output directory
- Automatic file naming with UUIDs
- Support for multiple image generation

## Usage Examples

### Basic Text-to-Image
```json
{
  "text": "A beautiful sunset over mountains",
  "model": "gpt-image-1",
  "size": "1024x1024",
  "quality": "standard"
}
```

### High-Quality DALL-E 3 Image
```json
{
  "text": "A futuristic cityscape at night",
  "model": "dall-e-3",
  "size": "1792x1024",
  "quality": "hd",
  "style": "vivid"
}
```

### Image Editing
```json
{
  "images": ["/path/to/image.png"],
  "prompt": "Add a rainbow in the sky",
  "model": "gpt-image-1"
}
```

## Troubleshooting

### Common Issues

1. **API Key Not Set**: Ensure `OPENAI_API_KEY` is configured in Smithery
2. **Model Restrictions**: Check model-specific size limitations
3. **File Paths**: Ensure output directories exist and are writable

## Common Issues and Solutions

### Issue: "No entry point found"
**Solution**: Ensure your package.json has a `module` field pointing to your TypeScript entry point:
```json
{
  "module": "./src/index.ts"
}
```

### Issue: "Top-level await is not supported with cjs output format"
**Solution**: Avoid top-level await in your main entry file. Instead, wrap async initialization in a function:
```typescript
// ❌ Don't do this (top-level await)
await server.connect(transport);

// ✅ Do this instead
async function startServer() {
  await server.connect(transport);
}
startServer().catch(console.error);
```

### Support

- [Smithery Documentation](https://smithery.ai/docs)
- [GitHub Issues](https://github.com/spartanz51/imagegen-mcp/issues)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference/images)

## Best Practices

1. **Error Handling**: The server includes comprehensive error handling
2. **Validation**: Input validation for all parameters
3. **Security**: Prompt sanitization and content filtering
4. **Performance**: Efficient image processing and storage
5. **Monitoring**: Detailed logging for debugging

## Next Steps

After deployment:

1. Test all functionality in the Smithery playground
2. Share your MCP server with the community
3. Monitor usage and performance
4. Update models and features as needed

For more information, visit the [Smithery Documentation](https://smithery.ai/docs/build/getting-started). 