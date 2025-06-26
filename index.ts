#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import express from "express";
import { Request, Response } from "express";

import { z } from "zod";

// Import Planka operations
import * as boardMemberships from "./operations/boardMemberships.js";
import * as boards from "./operations/boards.js";
import * as cards from "./operations/cards.js";
import * as comments from "./operations/comments.js";
import * as labels from "./operations/labels.js";
import * as lists from "./operations/lists.js";
import * as projects from "./operations/projects.js";
import * as tasks from "./operations/tasks.js";

// Import custom tools
import {
  createCardWithTasks,
  getBoardSummary,
  getCardDetails,
} from "./tools/index.js";

import { VERSION } from "./common/version.js";

// Create the MCP Server with proper configuration
const server = new McpServer({
  name: "planka-mcp-server",
  version: VERSION,
});

// Note: MCP Server doesn't have onerror, we'll handle errors in the runServer function

// ----- CONSOLIDATED KANBAN TOOLS -----

// 1. Project and Board Manager
server.tool(
  "mcp_kanban_project_board_manager",
  "Manage projects and boards with various operations",
  {
    action: z
      .enum([
        "get_projects",
        "get_project",
        "get_boards",
        "create_board",
        "get_board",
        "update_board",
        "delete_board",
        "get_board_summary",
      ])
      .describe("The action to perform"),
    id: z.string().optional().describe("The ID of the project or board"),
    projectId: z.string().optional().describe("The ID of the project"),
    name: z.string().optional().describe("The name of the board"),
    position: z.number().optional().describe("The position of the board"),
    type: z.string().optional().describe("The type of the board"),
    page: z
      .number()
      .optional()
      .describe("The page number for pagination (1-indexed)"),
    perPage: z.number().optional().describe("The number of items per page"),
    boardId: z
      .string()
      .optional()
      .describe("The ID of the board to get a summary for"),
    includeTaskDetails: z
      .boolean()
      .optional()
      .default(false)
      .describe("Whether to include detailed task information for each card"),
    includeComments: z
      .boolean()
      .optional()
      .default(false)
      .describe("Whether to include comments for each card"),
  },
  async (args) => {
    let result;

    switch (args.action) {
      case "get_projects":
        if (!args.page || !args.perPage)
          throw new Error(
            "page and perPage are required for get_projects action"
          );
        result = await projects.getProjects(args.page, args.perPage);
        break;

      case "get_project":
        if (!args.id) throw new Error("id is required for get_project action");
        result = await projects.getProject(args.id);
        break;

      case "get_boards":
        if (!args.projectId)
          throw new Error("projectId is required for get_boards action");
        result = await boards.getBoards(args.projectId);
        break;

      case "create_board":
        if (!args.projectId || !args.name || args.position === undefined)
          throw new Error(
            "projectId, name, and position are required for create_board action"
          );
        result = await boards.createBoard({
          projectId: args.projectId,
          name: args.name,
          position: args.position,
        });
        break;

      case "get_board":
        if (!args.id) throw new Error("id is required for get_board action");
        result = await boards.getBoard(args.id);
        break;

      case "update_board":
        if (!args.id || !args.name || args.position === undefined)
          throw new Error(
            "id, name, and position are required for update_board action"
          );
        const boardUpdateOptions = {
          name: args.name,
          position: args.position,
        } as any; // Use type assertion to avoid TypeScript errors

        if (args.type) {
          boardUpdateOptions.type = args.type;
        }

        result = await boards.updateBoard(args.id, boardUpdateOptions);
        break;

      case "delete_board":
        if (!args.id) throw new Error("id is required for delete_board action");
        result = await boards.deleteBoard(args.id);
        break;

      case "get_board_summary":
        if (!args.boardId)
          throw new Error("boardId is required for get_board_summary action");
        result = await getBoardSummary({
          boardId: args.boardId,
          includeTaskDetails: args.includeTaskDetails,
          includeComments: args.includeComments,
        });
        break;

      default:
        throw new Error(`Unknown action: ${args.action}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

// 2. List Manager
server.tool(
  "mcp_kanban_list_manager",
  "Manage kanban lists with various operations",
  {
    action: z
      .enum(["get_all", "create", "update", "delete", "get_one"])
      .describe("The action to perform"),
    id: z.string().optional().describe("The ID of the list"),
    boardId: z.string().optional().describe("The ID of the board"),
    name: z.string().optional().describe("The name of the list"),
    position: z.number().optional().describe("The position of the list"),
  },
  async (args) => {
    let result;

    switch (args.action) {
      case "get_all":
        if (!args.boardId)
          throw new Error("boardId is required for get_all action");
        result = await lists.getLists(args.boardId);
        break;

      case "create":
        if (!args.boardId || !args.name || args.position === undefined)
          throw new Error(
            "boardId, name, and position are required for create action"
          );
        result = await lists.createList({
          boardId: args.boardId,
          name: args.name,
          position: args.position,
        });
        break;

      case "get_one":
        if (!args.id) throw new Error("id is required for get_one action");
        result = await lists.getList(args.id);
        break;

      case "update":
        if (!args.id || !args.name || args.position === undefined)
          throw new Error(
            "id, name, and position are required for update action"
          );
        const { id, ...updateOptions } = args;
        result = await lists.updateList(id, {
          name: args.name,
          position: args.position,
        });
        break;

      case "delete":
        if (!args.id) throw new Error("id is required for delete action");
        result = await lists.deleteList(args.id);
        break;

      default:
        throw new Error(`Unknown action: ${args.action}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

// 3. Card Manager
server.tool(
  "mcp_kanban_card_manager",
  "Manage kanban cards with various operations",
  {
    action: z
      .enum([
        "get_all",
        "create",
        "get_one",
        "update",
        "move",
        "duplicate",
        "delete",
        "create_with_tasks",
        "get_details",
      ])
      .describe("The action to perform"),
    id: z.string().optional().describe("The ID of the card"),
    listId: z.string().optional().describe("The ID of the list"),
    boardId: z
      .string()
      .optional()
      .describe("The ID of the board (if moving between boards)"),
    projectId: z
      .string()
      .optional()
      .describe("The ID of the project (if moving between projects)"),
    name: z.string().optional().describe("The name of the card"),
    description: z.string().optional().describe("The description of the card"),
    position: z.number().optional().describe("The position of the card"),
    dueDate: z
      .string()
      .optional()
      .describe("The due date for the card (ISO format)"),
    isCompleted: z
      .boolean()
      .optional()
      .describe("Whether the card is completed"),
    tasks: z
      .array(z.string())
      .optional()
      .describe(
        "Array of task descriptions to create for create_with_tasks action"
      ),
    comment: z
      .string()
      .optional()
      .describe("Optional comment to add to the card"),
    cardId: z
      .string()
      .optional()
      .describe("The ID of the card to get details for"),
  },
  async (args) => {
    let result;

    switch (args.action) {
      case "get_all":
        if (!args.listId)
          throw new Error("listId is required for get_all action");
        result = await cards.getCards(args.listId);
        break;

      case "create":
        if (!args.listId || !args.name)
          throw new Error("listId and name are required for create action");
        result = await cards.createCard({
          listId: args.listId,
          name: args.name,
          description: args.description || "",
          position: args.position || 0,
        });
        break;

      case "get_one":
        if (!args.id) throw new Error("id is required for get_one action");
        result = await cards.getCard(args.id);
        break;

      case "update":
        if (!args.id) throw new Error("id is required for update action");
        const cardUpdateOptions = {} as any; // Use type assertion to avoid TypeScript errors

        if (args.name !== undefined) cardUpdateOptions.name = args.name;
        if (args.description !== undefined)
          cardUpdateOptions.description = args.description;
        if (args.position !== undefined)
          cardUpdateOptions.position = args.position;
        if (args.dueDate !== undefined)
          cardUpdateOptions.dueDate = args.dueDate;
        if (args.isCompleted !== undefined)
          cardUpdateOptions.isCompleted = args.isCompleted;

        result = await cards.updateCard(args.id, cardUpdateOptions);
        break;

      case "move":
        if (!args.id || !args.listId || args.position === undefined)
          throw new Error(
            "id, listId, and position are required for move action"
          );
        result = await cards.moveCard(
          args.id,
          args.listId,
          args.position,
          args.boardId,
          args.projectId
        );
        break;

      case "duplicate":
        if (!args.id || args.position === undefined)
          throw new Error("id and position are required for duplicate action");
        result = await cards.duplicateCard(args.id, args.position);
        break;

      case "delete":
        if (!args.id) throw new Error("id is required for delete action");
        result = await cards.deleteCard(args.id);
        break;

      case "create_with_tasks":
        if (!args.listId || !args.name)
          throw new Error(
            "listId and name are required for create_with_tasks action"
          );
        result = await createCardWithTasks({
          listId: args.listId,
          name: args.name,
          description: args.description,
          tasks: args.tasks,
          comment: args.comment,
          position: args.position,
        });
        break;

      case "get_details":
        if (!args.cardId)
          throw new Error("cardId is required for get_details action");
        result = await getCardDetails({
          cardId: args.cardId,
        });
        break;

      default:
        throw new Error(`Unknown action: ${args.action}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

// 4. Stopwatch Manager
server.tool(
  "mcp_kanban_stopwatch",
  "Manage card stopwatches for time tracking",
  {
    action: z
      .enum(["start", "stop", "get", "reset"])
      .describe("The action to perform"),
    id: z.string().describe("The ID of the card"),
  },
  async (args) => {
    let result;

    switch (args.action) {
      case "start":
        result = await cards.startCardStopwatch(args.id);
        break;

      case "stop":
        result = await cards.stopCardStopwatch(args.id);
        break;

      case "get":
        result = await cards.getCardStopwatch(args.id);
        break;

      case "reset":
        result = await cards.resetCardStopwatch(args.id);
        break;

      default:
        throw new Error(`Unknown action: ${args.action}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

// 5. Label Manager
server.tool(
  "mcp_kanban_label_manager",
  "Manage kanban labels with various operations",
  {
    action: z
      .enum([
        "get_all",
        "create",
        "update",
        "delete",
        "add_to_card",
        "remove_from_card",
      ])
      .describe("The action to perform"),
    id: z.string().optional().describe("The ID of the label"),
    boardId: z.string().optional().describe("The ID of the board"),
    cardId: z.string().optional().describe("The ID of the card"),
    labelId: z
      .string()
      .optional()
      .describe("The ID of the label (for card operations)"),
    name: z.string().optional().describe("The name of the label"),
    color: z
      .enum([
        "berry-red",
        "pumpkin-orange",
        "lagoon-blue",
        "pink-tulip",
        "light-mud",
        "orange-peel",
        "bright-moss",
        "antique-blue",
        "dark-granite",
        "lagune-blue",
        "sunny-grass",
        "morning-sky",
        "light-orange",
        "midnight-blue",
        "tank-green",
        "gun-metal",
        "wet-moss",
        "red-burgundy",
        "light-concrete",
        "apricot-red",
        "desert-sand",
        "navy-blue",
        "egg-yellow",
        "coral-green",
        "light-cocoa",
      ])
      .optional()
      .describe("The color of the label"),
    position: z.number().optional().describe("The position of the label"),
  },
  async (args) => {
    let result;

    switch (args.action) {
      case "get_all":
        if (!args.boardId)
          throw new Error("boardId is required for get_all action");
        result = await labels.getLabels(args.boardId);
        break;

      case "create":
        if (
          !args.boardId ||
          !args.name ||
          !args.color ||
          args.position === undefined
        )
          throw new Error(
            "boardId, name, color, and position are required for create action"
          );
        result = await labels.createLabel({
          boardId: args.boardId,
          name: args.name,
          color: args.color,
          position: args.position,
        });
        break;

      case "update":
        if (
          !args.id ||
          !args.name ||
          !args.color ||
          args.position === undefined
        )
          throw new Error(
            "id, name, color, and position are required for update action"
          );
        result = await labels.updateLabel(args.id, {
          name: args.name,
          color: args.color,
          position: args.position,
        });
        break;

      case "delete":
        if (!args.id) throw new Error("id is required for delete action");
        result = await labels.deleteLabel(args.id);
        break;

      case "add_to_card":
        if (!args.cardId || !args.labelId)
          throw new Error(
            "cardId and labelId are required for add_to_card action"
          );
        result = await labels.addLabelToCard(args.cardId, args.labelId);
        break;

      case "remove_from_card":
        if (!args.cardId || !args.labelId)
          throw new Error(
            "cardId and labelId are required for remove_from_card action"
          );
        result = await labels.removeLabelFromCard(args.cardId, args.labelId);
        break;

      default:
        throw new Error(`Unknown action: ${args.action}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

// 6. Task Manager
server.tool(
  "mcp_kanban_task_manager",
  "Manage kanban tasks with various operations",
  {
    action: z
      .enum([
        "get_all",
        "create",
        "batch_create",
        "get_one",
        "update",
        "delete",
        "complete_task",
      ])
      .describe("The action to perform"),
    id: z.string().optional().describe("The ID of the task"),
    cardId: z.string().optional().describe("The ID of the card"),
    name: z.string().optional().describe("The name of the task"),
    isCompleted: z
      .boolean()
      .optional()
      .describe("Whether the task is completed"),
    position: z.number().optional().describe("The position of the task"),
    tasks: z
      .array(
        z.object({
          cardId: z.string().describe("The ID of the card for this task"),
          name: z.string().describe("The name of this task"),
          position: z.number().optional().describe("The position of this task"),
        })
      )
      .optional()
      .describe("Array of tasks to create in batch"),
  },
  async (args) => {
    let result;

    switch (args.action) {
      case "get_all":
        if (!args.cardId)
          throw new Error("cardId is required for get_all action");
        result = await tasks.getTasks(args.cardId);
        break;

      case "create":
        if (!args.cardId || !args.name)
          throw new Error("cardId and name are required for create action");
        result = await tasks.createTask({
          cardId: args.cardId,
          name: args.name,
          position: args.position,
        });
        break;

      case "batch_create":
        if (!args.tasks || args.tasks.length === 0)
          throw new Error("tasks array is required for batch_create action");
        result = await tasks.batchCreateTasks({ tasks: args.tasks });
        break;

      case "get_one":
        if (!args.id) throw new Error("id is required for get_one action");
        result = await tasks.getTask(args.id);
        break;

      case "update":
        if (!args.id) throw new Error("id is required for update action");
        const taskUpdateOptions = {} as any;

        if (args.name !== undefined) taskUpdateOptions.name = args.name;
        if (args.position !== undefined)
          taskUpdateOptions.position = args.position;
        if (args.isCompleted !== undefined)
          taskUpdateOptions.isCompleted = args.isCompleted;

        result = await tasks.updateTask(args.id, taskUpdateOptions);
        break;

      case "complete_task":
        if (!args.id)
          throw new Error("id is required for complete_task action");
        result = await tasks.updateTask(args.id, { isCompleted: true } as any);
        break;

      case "delete":
        if (!args.id) throw new Error("id is required for delete action");
        result = await tasks.deleteTask(args.id);
        break;

      default:
        throw new Error(`Unknown action: ${args.action}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

// 7. Comment Manager
server.tool(
  "mcp_kanban_comment_manager",
  "Manage card comments with various operations",
  {
    action: z
      .enum(["get_all", "create", "get_one", "update", "delete"])
      .describe("The action to perform"),
    id: z.string().optional().describe("The ID of the comment"),
    cardId: z.string().optional().describe("The ID of the card"),
    text: z.string().optional().describe("The text content of the comment"),
  },
  async (args) => {
    let result;

    switch (args.action) {
      case "get_all":
        if (!args.cardId)
          throw new Error("cardId is required for get_all action");
        result = await comments.getComments(args.cardId);
        break;

      case "create":
        if (!args.cardId || !args.text)
          throw new Error("cardId and text are required for create action");
        result = await comments.createComment({
          cardId: args.cardId,
          text: args.text,
        });
        break;

      case "get_one":
        if (!args.id) throw new Error("id is required for get_one action");
        result = await comments.getComment(args.id);
        break;

      case "update":
        if (!args.id || !args.text)
          throw new Error("id and text are required for update action");
        result = await comments.updateComment(args.id, {
          text: args.text,
        });
        break;

      case "delete":
        if (!args.id) throw new Error("id is required for delete action");
        result = await comments.deleteComment(args.id);
        break;

      default:
        throw new Error(`Unknown action: ${args.action}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

// 8. Membership Manager
server.tool(
  "mcp_kanban_membership_manager",
  "Manage board memberships with various operations",
  {
    action: z
      .enum(["get_all", "create", "get_one", "update", "delete"])
      .describe("The action to perform"),
    id: z.string().optional().describe("The ID of the membership"),
    boardId: z.string().optional().describe("The ID of the board"),
    userId: z.string().optional().describe("The ID of the user"),
    role: z
      .enum(["editor", "viewer"])
      .optional()
      .describe("The role of the user in the board"),
    canComment: z
      .boolean()
      .optional()
      .describe("Whether the user can comment on the board"),
  },
  async (args) => {
    let result;

    switch (args.action) {
      case "get_all":
        if (!args.boardId)
          throw new Error("boardId is required for get_all action");
        result = await boardMemberships.getBoardMemberships(args.boardId);
        break;

      case "create":
        if (!args.boardId || !args.userId || !args.role)
          throw new Error(
            "boardId, userId, and role are required for create action"
          );
        result = await boardMemberships.createBoardMembership({
          boardId: args.boardId,
          userId: args.userId,
          role: args.role,
        });
        break;

      case "get_one":
        if (!args.id) throw new Error("id is required for get_one action");
        result = await boardMemberships.getBoardMembership(args.id);
        break;

      case "update":
        if (!args.id) throw new Error("id is required for update action");
        const membershipUpdateOptions = {} as any;

        if (args.role !== undefined) membershipUpdateOptions.role = args.role;
        if (args.canComment !== undefined)
          membershipUpdateOptions.canComment = args.canComment;

        result = await boardMemberships.updateBoardMembership(
          args.id,
          membershipUpdateOptions
        );
        break;

      case "delete":
        if (!args.id) throw new Error("id is required for delete action");
        result = await boardMemberships.deleteBoardMembership(args.id);
        break;

      default:
        throw new Error(`Unknown action: ${args.action}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

async function validateEnvironment() {
  // Validate environment variables
  console.error("Creating Planka MCP Server...");
  console.error("Server info: planka-mcp-server");
  console.error("Version:", VERSION);
  
  if (!process.env.PLANKA_BASE_URL) {
    console.error("Warning: PLANKA_BASE_URL environment variable not set");
  } else {
    console.error("PLANKA_BASE_URL:", process.env.PLANKA_BASE_URL);
  }
  
  if (!process.env.PLANKA_AGENT_EMAIL) {
    console.error("Warning: PLANKA_AGENT_EMAIL environment variable not set");
  } else {
    console.error("PLANKA_AGENT_EMAIL:", process.env.PLANKA_AGENT_EMAIL);
  }
  
  if (!process.env.PLANKA_AGENT_PASSWORD) {
    console.error("Warning: PLANKA_AGENT_PASSWORD environment variable not set");
  } else {
    console.error("PLANKA_AGENT_PASSWORD:", "***");
  }
}

async function startStdioServer() {
  try {
    console.error("Starting Planka MCP Server in stdio mode...");
    
    // Create transport
    const transport = new StdioServerTransport();
    
    console.error("Connecting server to transport...");
    
    // Connect server to transport - this should keep the process alive
    await server.connect(transport);
    
    console.error("MCP Server connected and ready!");
    console.error("Available tools:", [
      "mcp_kanban_project_board_manager",
      "mcp_kanban_list_manager", 
      "mcp_kanban_card_manager",
      "mcp_kanban_stopwatch",
      "mcp_kanban_label_manager",
      "mcp_kanban_task_manager",
      "mcp_kanban_comment_manager",
      "mcp_kanban_membership_manager"
    ]);
    
  } catch (error) {
    console.error("Error starting stdio server:", error);
    console.error("Stack trace:", (error as Error).stack);
    process.exit(1);
  }
}

async function startHttpServer(port = 3000) {
  try {
    console.error("Starting Planka MCP Server in HTTP mode...");
    
    const app = express();
    app.use(express.json());
    
    // Define una función para obtener el servidor MCP
    const getServer = () => server;
    
    // Create HTTP endpoints for MCP
    app.post('/mcp', async (req: Request, res: Response) => {
      // En el modo HTTP, debemos usar una implementación simple de transporte
      // Debido a que no disponemos del módulo específico, usaremos un enfoque simplificado
      try {
        console.log('Received POST MCP request');
        
        // Implementamos una versión simplificada del manejo de la petición
        // Esto responderá con un mensaje indicando que se debe usar el transporte de stdio
        res.status(200).json({
          jsonrpc: '2.0',
          result: {
            message: 'MCP Server is running. This HTTP endpoint is for testing only. Please use stdio transport for full functionality.'
          },
          id: req.body.id || null
        });
      } catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal server error',
            },
            id: req.body.id || null,
          });
        }
      }
    });
    
    app.get('/mcp', async (req: Request, res: Response) => {
      console.log('Received GET MCP request');
      res.status(405).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Method not allowed. Use POST for MCP requests."
        },
        id: null
      });
    });
    
    // Add a status endpoint
    app.get('/status', (_req: Request, res: Response) => {
      res.status(200).json({
        status: 'ok',
        server: 'planka-mcp-server',
        version: VERSION
      });
    });
    
    // Start the server
    app.listen(port, () => {
      console.error(`MCP Server listening on port ${port}`);
      console.error(`Status endpoint available at http://localhost:${port}/status`);
    });
    
  } catch (error) {
    console.error("Error starting HTTP server:", error);
    console.error("Stack trace:", (error as Error).stack);
    process.exit(1);
  }
}

async function runServer() {
  try {
    // Validate environment
    await validateEnvironment();
    
    // Determine server type based on environment variables
    const serverType = process.env.MCP_SERVER_TYPE || 'stdio';
    const httpPort = parseInt(process.env.MCP_HTTP_PORT || '3000', 10);
    
    if (serverType === 'http') {
      await startHttpServer(httpPort);
    } else {
      await startStdioServer();
    }
    
  } catch (error) {
    console.error("Error starting server:", error);
    console.error("Stack trace:", (error as Error).stack);
    process.exit(1);
  }
}

// Start the server
runServer();
