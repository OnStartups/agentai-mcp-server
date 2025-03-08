#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

// Server implementation
const server = new Server(
  {
    name: "agent-ai-tools-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Check for API token
const API_TOKEN = process.env.API_TOKEN;
if (!API_TOKEN) {
  console.error("Error: API_TOKEN environment variable is required");
  process.exit(1);
}

// Simple cache for tools
let toolsCache = {
  tools: [],
  lastFetch: 0,
  ttl: 300000 // 5 minutes cache
};

// Function to convert API schema to MCP Tool schema
function convertToToolSchema(apiFunction) {
  return {
    name: apiFunction.name,
    description: apiFunction.description,
    inputSchema: {
      type: "object",
      properties: Object.fromEntries(
        Object.entries(apiFunction.parameters.properties).map(([key, prop]) => [
          key,
          {
            type: prop.type,
            description: prop.description,
            default: prop.default,
            enum: prop.enum,
          }
        ])
      ),
      required: apiFunction.parameters.required || [],
    }
  };
}

// Function to fetch available tools from the API
async function fetchAvailableTools() {
  const now = Date.now();
  
  // Return cached tools if available and not expired
  if (toolsCache.tools.length > 0 && (now - toolsCache.lastFetch) < toolsCache.ttl) {
    return toolsCache.tools;
  }
  
  try {
    console.error("Fetching available tools from API...");
    
    const response = await fetch('https://api-lr.agent.ai/api/v2/mcp/functions', {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const functionsData = await response.json();
    
    // Convert API function definitions to MCP Tool format
    const tools = functionsData.map(convertToToolSchema);
    
    // Update cache
    toolsCache.tools = tools;
    toolsCache.lastFetch = now;
    
    return tools;
  } catch (error) {
    console.error("Error fetching available tools:", error);
    
    // Return cached tools if available, even if expired
    if (toolsCache.tools.length > 0) {
      console.error("Using cached tools due to fetch error");
      return toolsCache.tools;
    }
    
    return []; // Return empty array if can't fetch and no cache
  }
}

// Rate limiting removed as requested

// Generic function to call the API
async function callApiFunction(functionName, args) {
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(args)
  };

  const response = await fetch(`https://api-lr.agent.ai/v1/action/${functionName}`, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

// Format API response for MCP
function formatApiResponse(apiResponse) {
  // If the response is already a string, return it directly
  if (typeof apiResponse === 'string') {
    return apiResponse;
  }
  
  // If the response has a 'text' or 'content' field, use that
  if (apiResponse.text) {
    return apiResponse.text;
  }
  if (apiResponse.content) {
    return apiResponse.content;
  }
  
  // For YouTube transcripts, format them nicely if they have timestamps
  if (apiResponse.transcript) {
    if (Array.isArray(apiResponse.transcript)) {
      return apiResponse.transcript
        .map(entry => `[${entry.timestamp || ''}] ${entry.text}`)
        .join('\n');
    }
    return apiResponse.transcript;
  }
  
  // For screenshots, return the URL if available
  if (apiResponse.screenshot_url) {
    return `Screenshot URL: ${apiResponse.screenshot_url}`;
  }
  
  // Default: stringify the entire response
  return JSON.stringify(apiResponse, null, 2);
}

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = await fetchAvailableTools();
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    if (!args) {
      throw new Error("No arguments provided");
    }

    console.error(`Calling function ${name} with args:`, args);
    
    // Call the appropriate API function
    const result = await callApiFunction(name, args);
    
    // Format the response for MCP
    const formattedResponse = formatApiResponse(result);
    
    return {
      content: [{ type: "text", text: formattedResponse }],
      isError: false,
    };
  } catch (error) {
    console.error(`Error calling tool:`, error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Agent.ai Tools MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});