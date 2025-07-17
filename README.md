# OpenAI Image Generation MCP Server

A Model Context Protocol (MCP) server that provides image generation and editing capabilities using OpenAI's latest image models including DALL-E 3 and GPT-image-1.

## Features

- **Text-to-Image Generation**: Generate high-quality images from text descriptions
- **Image-to-Image Editing**: Edit existing images with text prompts
- **Multiple Model Support**: DALL-E 2, DALL-E 3, and GPT-image-1
- **Flexible Output Options**: Various sizes, formats, and quality settings
- **Smart Directory Management**: Proper image saving with configurable output paths
- **Content Safety**: Built-in prompt validation and content filtering
- **MCP Compatible**: Seamless integration with MCP-enabled applications

## Supported Models

| Model | Text-to-Image | Image-to-Image | Max Images | Sizes Supported |
|-------|---------------|----------------|------------|-----------------|
| `dall-e-2` | ✅ | ✅ | 10 | 256x256, 512x512, 1024x1024 |
| `dall-e-3` | ✅ | ❌ | 1 | 1024x1024, 1792x1024, 1024x1792 |
| `gpt-image-1` | ✅ | ✅ | 10 | 1024x1024, 1024x1536, 1536x1024 |

## Installation

### Prerequisites

- Node.js 18 or higher
- OpenAI API key

### Smithery Deployment (Recommended)

The easiest way to deploy this MCP server is through [Smithery](https://smithery.ai):

1. **Fork/Clone** this repository to your GitHub account
2. **Create account** at [smithery.ai](https://smithery.ai)
3. **Connect GitHub** and import this repository
4. **Configure** your `OPENAI_API_KEY` environment variable
5. **Deploy** with one click

The server includes lazy loading for tool discovery, making it easy for users to explore capabilities before configuration.

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Install from npm

```bash
npm install -g imagegen-mcp
```

### Install from source

```bash
git clone https://github.com/spartanz51/imagegen-mcp.git
cd imagegen-mcp
npm install
npm run build
```

## Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### MCP Settings

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "imagegen": {
      "command": "imagegen-mcp",
      "env": {
        "OPENAI_API_KEY": "your_openai_api_key_here"
      }
    }
  }
}
```

### Model Filtering

You can restrict which models are available:

```json
{
  "mcpServers": {
    "imagegen": {
      "command": "imagegen-mcp",
      "args": ["--models", "gpt-image-1", "dall-e-3"],
      "env": {
        "OPENAI_API_KEY": "your_openai_api_key_here"
      }
    }
  }
}
```

## Usage

### Text-to-Image Generation

The `text-to-image` tool generates images from text descriptions:

**Parameters:**
- `text` (required): The text prompt describing the image
- `outputPath` (optional): Directory or file path where the image should be saved
- `model` (optional): Model to use (`dall-e-2`, `dall-e-3`, `gpt-image-1`)
- `size` (optional): Image dimensions
- `style` (optional): Style for DALL-E 3 (`vivid`, `natural`)
- `output_format` (optional): Output format (`png`, `jpeg`, `webp`)
- `output_compression` (optional): Compression level (0-100)
- `quality` (optional): Image quality setting
- `n` (optional): Number of images to generate (1-10, model dependent)

**Example:**
```javascript
// Generate a high-quality image with GPT-image-1
{
  "text": "A majestic mountain landscape at sunset with a crystal clear lake reflecting the sky",
  "model": "gpt-image-1",
  "size": "1536x1024",
  "quality": "high",
  "output_format": "webp",
  "outputPath": "/path/to/save/directory"
}
```

### Image-to-Image Editing

The `image-to-image` tool edits existing images based on text prompts:

**Parameters:**
- `images` (required): Array of image file paths to edit
- `prompt` (required): Text description of desired changes
- `outputPath` (optional): Directory or file path where the edited image should be saved
- `mask` (optional): Mask image path (PNG with transparent areas to edit)
- `model` (optional): Model to use (`dall-e-2`, `gpt-image-1`)
- `size` (optional): Output image dimensions
- `output_format` (optional): Output format (`png`, `jpeg`, `webp`)
- `output_compression` (optional): Compression level (0-100)
- `quality` (optional): Image quality setting
- `n` (optional): Number of edited images to generate

**Example:**
```javascript
// Edit an image to add elements
{
  "images": ["/path/to/input/image.jpg"],
  "prompt": "Add a rainbow in the sky and make the lighting more dramatic",
  "model": "gpt-image-1",
  "size": "1024x1024",
  "quality": "high",
  "outputPath": "/path/to/save/directory"
}
```

## Quality Settings

### DALL-E 2 & 3
- `standard`: Standard quality (faster)
- `hd`: High definition (slower, more detailed)

### GPT-image-1
- `low`: Low quality (fastest)
- `medium`: Medium quality (balanced)
- `high`: High quality (slowest, most detailed)

## Output Formats

- **PNG**: Best for images with transparency or sharp edges
- **JPEG**: Best for photographs and complex images
- **WEBP**: Best balance of quality and file size

## Image Sizes

### DALL-E 2
- `256x256`: Small square
- `512x512`: Medium square  
- `1024x1024`: Large square

### DALL-E 3
- `1024x1024`: Square
- `1792x1024`: Wide landscape
- `1024x1792`: Tall portrait

### GPT-image-1
- `1024x1024`: Square
- `1536x1024`: Wide landscape
- `1024x1536`: Tall portrait

## File Management

### Output Path Behavior

- **No outputPath**: Saves to current working directory with UUID filename
- **Directory path**: Saves to specified directory with UUID filename
- **File path**: Saves to exact specified location
- **Relative path**: Resolved relative to current working directory

### File Naming

- Generated images use UUID filenames by default: `550e8400-e29b-41d4-a716-446655440000.webp`
- Specify exact filename in outputPath to override: `/path/to/my-image.png`

## Error Handling

The server includes comprehensive error handling for:

- **Content Safety**: Automatic prompt validation and sanitization
- **File Validation**: Image size limits (20MB max) and format checking
- **API Errors**: Detailed error messages from OpenAI API
- **Path Validation**: Directory creation and file permission checks

## Content Safety

Built-in content filtering prevents generation of:
- Explicit or inappropriate content
- Violence or harmful imagery
- Copyrighted material
- Personal information

## Development

### Building

```bash
npm run build
```

### Running in Development

```bash
npm run dev
```

### Testing

```bash
# Test the MCP server
echo '{"text": "A beautiful sunset"}' | node dist/index.js
```

## API Compatibility

This server is built to work with the latest OpenAI Image Generation API specifications as of 2024. It supports:

- OpenAI API v1 endpoints
- Latest model parameters and options
- Proper error handling and response formats
- Content moderation and safety features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [https://github.com/spartanz51/imagegen-mcp/issues](https://github.com/spartanz51/imagegen-mcp/issues)
- Documentation: This README and inline code comments

## Changelog

### v1.1.0
- Added support for GPT-image-1 model
- Enhanced image editing capabilities
- Improved file path handling and MCP compatibility
- Added content safety validation
- Better error handling and logging
- Updated API parameters to match latest OpenAI specifications

### v1.0.4
- Initial release with DALL-E 2 and DALL-E 3 support
- Basic text-to-image generation
- Image editing functionality 