# OpenAI Image Generation MCP Server

A clean, simple Model Context Protocol (MCP) server for generating and editing images using OpenAI's latest image models including DALL-E 3 and GPT-image-1.

## ✨ Features

- **Text-to-Image Generation**: Generate high-quality images from text descriptions
- **Image-to-Image Editing**: Edit existing images with text prompts
- **Multiple Model Support**: DALL-E 2, DALL-E 3, and GPT-image-1
- **Flexible Output Options**: Various sizes, formats, and quality settings
- **Smart Directory Management**: Proper image saving with configurable output paths
- **Content Safety**: Built-in prompt validation and content filtering
- **Smithery Ready**: Optimized for easy deployment on Smithery platform
- **CommonJS Compatible**: No top-level await for better compatibility

## 🚀 Quick Start

### Smithery Deployment (Recommended)

Deploy instantly on [Smithery](https://smithery.ai):

1. **Fork** this repository to your GitHub account
2. **Connect** your GitHub to Smithery
3. **Import** this repository
4. **Set** your `OPENAI_API_KEY` environment variable
5. **Deploy** with one click

### Local Installation

```bash
# Clone the repository
git clone https://github.com/spartanz51/imagegen-mcp.git
cd imagegen-mcp

# Install dependencies
npm install

# Set your OpenAI API key
export OPENAI_API_KEY="your-api-key-here"

# Build and run
npm run build
npm start
```

## 📋 Supported Models

| Model | Text-to-Image | Image-to-Image | Max Images | Best For |
|-------|---------------|----------------|------------|----------|
| **GPT-image-1** | ✅ | ✅ | 1 | Latest model with superior understanding |
| **DALL-E 3** | ✅ | ❌ | 1 | High-quality artistic images |
| **DALL-E 2** | ✅ | ✅ | 10 | Batch generation and editing |

## 🛠️ Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=your_openai_api_key

# Optional
DEFAULT_OUTPUT_PATH=/path/to/save/images
```

### Supported Parameters

#### Text-to-Image
- **text**: Image description prompt
- **model**: `gpt-image-1` | `dall-e-3` | `dall-e-2`
- **size**: `256x256` | `512x512` | `1024x1024` | `1536x1024` | `1024x1536` | `1792x1024` | `1024x1792`
- **style**: `vivid` | `natural` (DALL-E 3 only)
- **quality**: `standard` | `hd` | `low` | `medium` | `high`
- **output_format**: `png` | `jpeg` | `webp`
- **output_compression**: 0-100 (compression level)
- **moderation**: `low` | `auto`
- **n**: 1-10 (number of images, DALL-E 2 only)

#### Image-to-Image
- **images**: Array of image file paths
- **prompt**: Description of desired changes
- **mask**: Optional mask image path
- **model**: `gpt-image-1` | `dall-e-2` (DALL-E 3 not supported)
- All other parameters same as text-to-image

## 📁 Project Structure

```
blog-imagegen-mcp/
├── src/
│   ├── index.ts              # Main server implementation
│   └── libs/
│       └── openaiImageClient.ts  # OpenAI API client
├── dist/                     # Compiled JavaScript
├── smithery.yaml            # Smithery configuration
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

## 🔧 Architecture

The codebase follows a clean, modular architecture:

- **Single Entry Point**: `src/index.ts` contains the complete MCP server
- **Clean Class Structure**: `ImageGenServer` class handles all functionality
- **No Top-level Await**: CommonJS compatible for Smithery deployment
- **Lazy Loading**: Tools are discoverable without API key configuration
- **Proper Error Handling**: Comprehensive error messages and validation

## 🧪 Testing

```bash
# Test tool discovery
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node dist/index.js

# Test image generation (requires API key)
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "text-to-image", "arguments": {"text": "A beautiful sunset"}}}' | OPENAI_API_KEY=your-key node dist/index.js
```

## 🔒 Security

- **Input Validation**: All parameters are validated using Zod schemas
- **Content Filtering**: Basic content safety checks on prompts
- **File Path Validation**: Secure handling of file paths and directories
- **API Key Protection**: Environment variable based configuration

## 📚 Usage Examples

### Basic Text-to-Image
```json
{
  "text": "A futuristic city at sunset with flying cars"
}
```

### High-Quality Image with Specific Format
```json
{
  "text": "A serene mountain lake with perfect reflections",
  "model": "dall-e-3",
  "size": "1792x1024",
  "quality": "hd",
  "style": "natural",
  "output_format": "webp"
}
```

### Image Editing
```json
{
  "images": ["/path/to/image.jpg"],
  "prompt": "Add a rainbow in the sky",
  "model": "gpt-image-1"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

ISC License - see LICENSE file for details

## 🆘 Support

- [GitHub Issues](https://github.com/spartanz51/imagegen-mcp/issues)
- [Smithery Documentation](https://smithery.ai/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference/images)

---

**Ready to generate amazing images?** Deploy on [Smithery](https://smithery.ai) now! 🚀 