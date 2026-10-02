import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Session } from './session.js';
import type { Bridge } from './bridge.js';
export declare function createServer(source: Bridge | Session): McpServer;
