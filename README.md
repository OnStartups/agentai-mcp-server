# Agent.ai MCP Server

An MCP server implementation that integrates with the Agent.ai API, providing web text extraction, web screenshots, and YouTube transcript capabilities through a dynamic function loading system.

## Features

- **Dynamic Function Loading**: Automatically fetches available functions from Agent.ai API
- **Web Text Extraction**: Scrape or crawl web pages for text content
- **Web Screenshots**: Capture visual screenshots of web pages
- **YouTube Transcripts**: Extract transcripts from YouTube videos
- **Caching**: Efficient caching of function definitions to reduce API calls

## Tools

The server dynamically loads tools from the Agent.ai API. The currently available tools include:

- **grab_web_text**
  - Extract text content from web pages
  - Inputs:
    - `url` (string, required): URL of the web page to extract
    - `mode` (string, optional): "scrape" for one page, "crawl" for up to 100 pages
  
- **grab_web_screenshot**
  - Capture visual screenshots of web pages
  - Inputs:
    - `url` (string, required): URL of the web page to capture
    - `ttl_for_screenshot` (integer, optional): Cache expiration time in seconds

- **get_youtube_transcript**
  - Fetch transcripts from YouTube videos
  - Inputs:
    - `url` (string, required): URL of the YouTube video

and dozens of other tools. To see all available tools, visit https://docs.agent.ai/api-reference.

## Configuration

### Getting an API Token
To use this MCP server, you'll need an Agent.ai API token. Contact Agent.ai to obtain your token.

### Usage with Claude Desktop
Add this to your `claude_desktop_config.json`:

### Docker

```json
{
  "mcpServers": {
    "agentai": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "API_TOKEN",
        "mcp/agentai"
      ],
      "env": {
        "API_TOKEN": "YOUR_API_TOKEN_HERE"
      }
    }
  }
}
```

### NPX

```json
{
  "mcpServers": {
    "agentai": {
      "command": "npx",
      "args": [
        "-y",
        "@agentai/mcp-server"
      ],
      "env": {
        "API_TOKEN": "YOUR_API_TOKEN_HERE"
      }
    }
  }
}
```

## API Usage Examples

### Extract Web Text

```javascript
const options = {
  method: 'POST',
  headers: {Authorization: 'Bearer <token>', 'Content-Type': 'application/json'},
  body: '{"url":"https://agent.ai","mode":"scrape"}'
};

fetch('https://api-lr.agent.ai/v1/action/grab_web_text', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));
```

### Capture Web Screenshot

```javascript
const options = {
  method: 'POST',
  headers: {Authorization: 'Bearer <token>', 'Content-Type': 'application/json'},
  body: '{"url":"https://agent.ai","ttl_for_screenshot":86400}'
};

fetch('https://api-lr.agent.ai/v1/action/grab_web_screenshot', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));
```

### Get YouTube Transcript

```javascript
const options = {
  method: 'POST',
  headers: {Authorization: 'Bearer <token>', 'Content-Type': 'application/json'},
  body: '{"url":"https://youtube.com/watch?v=example"}'
};

fetch('https://api-lr.agent.ai/v1/action/get_youtube_transcript', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));
```

## Build

Docker build:

```bash
docker build -t mcp/agentai:latest .
```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.