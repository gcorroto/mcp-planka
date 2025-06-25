/**
 * @fileoverview Board operations for the MCP Kanban server
 *
 * This module provides functions for interacting with boards in the Planka Kanban system,
 * including creating, retrieving, updating, and deleting boards. It also handles
 * the creation of default lists and labels when a new board is created.
 */

import { z } from "zod";
import { plankaRequest } from "../common/utils.js";
import { PlankaBoardSchema } from "../common/types.js";
import { getAdminUserId } from "../common/setup.js";
import * as boardMemberships from "./boardMemberships.js";
import * as lists from "./lists.js";
import * as labels from "./labels.js";

// Schema definitions
/**
 * Schema for creating a new board
 * @property {string} projectId - The ID of the project to create the board in
 * @property {string} name - The name of the board
 * @property {number} [position] - The position of the board in the project (default: 65535)
 */
export const CreateBoardSchema = z.object({
    projectId: z.string().describe("Project ID"),
    name: z.string().describe("Board name"),
    position: z.number().default(65535).describe(
        "Board position (default: 65535)",
    ),
});

/**
 * Schema for retrieving boards from a project
 * @property {string} projectId - The ID of the project to get boards from
 */
export const GetBoardsSchema = z.object({
    projectId: z.string().describe("Project ID"),
});

/**
 * Schema for retrieving a specific board
 * @property {string} id - The ID of the board to retrieve
 */
export const GetBoardSchema = z.object({
    id: z.string().describe("Board ID"),
});

/**
 * Schema for updating a board
 * @property {string} id - The ID of the board to update
 * @property {string} [name] - The new name for the board
 * @property {number} [position] - The new position for the board
 * @property {string} [type] - The type of the board
 */
export const UpdateBoardSchema = z.object({
    id: z.string().describe("Board ID"),
    name: z.string().optional().describe("Board name"),
    position: z.number().optional().describe("Board position"),
    type: z.string().optional().describe("Board type"),
});

/**
 * Schema for deleting a board
 * @property {string} id - The ID of the board to delete
 */
export const DeleteBoardSchema = z.object({
    id: z.string().describe("Board ID"),
});

// Type exports
/**
 * Type definition for board creation options
 */
export type CreateBoardOptions = z.infer<typeof CreateBoardSchema>;

/**
 * Type definition for board update options
 */
export type UpdateBoardOptions = z.infer<typeof UpdateBoardSchema>;

// Response schemas
const BoardsResponseSchema = z.object({
    items: z.array(PlankaBoardSchema),
    included: z.record(z.any()).optional(),
});

const BoardResponseSchema = z.object({
    item: PlankaBoardSchema,
    included: z.record(z.any()).optional(),
});

// Function implementations
/**
 * Creates default lists for a new board
 *
 * @param {string} boardId - The ID of the board to create lists for
 * @returns {Promise<void>}
 * @private
 */
async function createDefaultLists(boardId: string) {
    try {
        const defaultLists = [
            { name: "Backlog", position: 65535 },
            { name: "To Do", position: 131070 },
            { name: "In Progress", position: 196605 },
            { name: "On Hold", position: 262140 },
            { name: "Review", position: 327675 },
            { name: "Done", position: 393210 },
        ];

        for (const list of defaultLists) {
            await lists.createList({
                boardId,
                name: list.name,
                position: list.position,
            });
        }
    } catch (error) {
        console.error(
            `Error creating default lists for board ${boardId}:`,
            error instanceof Error ? error.message : String(error),
        );
    }
}

/**
 * Creates default labels for a new board
 * @param boardId The ID of the board to create labels for
 */
async function createDefaultLabels(boardId: string) {
    try {
        // Priority labels
        const priorityLabels = [
            { name: "P0: Critical", color: "berry-red", position: 65535 },
            { name: "P1: High", color: "red-burgundy", position: 131070 },
            { name: "P2: Medium", color: "pumpkin-orange", position: 196605 },
            { name: "P3: Low", color: "sunny-grass", position: 262140 },
        ];

        // Type labels
        const typeLabels = [
            { name: "Bug", color: "coral-green", position: 327675 },
            { name: "Feature", color: "lagoon-blue", position: 393210 },
            { name: "Enhancement", color: "bright-moss", position: 458745 },
            { name: "Documentation", color: "light-orange", position: 524280 },
        ];

        // Status labels
        const statusLabels = [
            { name: "Blocked", color: "midnight-blue", position: 589815 },
            { name: "Needs Info", color: "desert-sand", position: 655350 },
            { name: "Ready", color: "egg-yellow", position: 720885 },
        ];

        // Combine all labels
        const defaultLabels = [
            ...priorityLabels,
            ...typeLabels,
            ...statusLabels,
        ];

        for (const label of defaultLabels) {
            await labels.createLabel({
                boardId,
                name: label.name,
                color: label.color as any, // Type assertion needed due to enum constraints
                position: label.position,
            });
        }
    } catch (error) {
        console.error(
            `Error creating default labels for board ${boardId}:`,
            error instanceof Error ? error.message : String(error),
        );
    }
}

/**
 * Creates a new board in a project with default lists and labels
 *
 * @param {CreateBoardOptions} options - Options for creating the board
 * @param {string} options.projectId - The ID of the project to create the board in
 * @param {string} options.name - The name of the board
 * @param {number} [options.position] - The position of the board in the project
 * @returns {Promise<object>} The created board
 * @throws {Error} If the board creation fails
 */
export async function createBoard(options: CreateBoardOptions) {
    try {
        const response = await plankaRequest(
            `/api/projects/${options.projectId}/boards`,
            {
                method: "POST",
                body: {
                    name: options.name,
                    position: options.position,
                },
            },
        );
        const parsedResponse = BoardResponseSchema.parse(response);
        const board = parsedResponse.item;

        // Add the admin user as a board member
        try {
            const adminUserId = await getAdminUserId();
            if (adminUserId) {
                await boardMemberships.createBoardMembership({
                    boardId: board.id,
                    userId: adminUserId,
                    role: "editor",
                });
            } else {
                console.error(
                    "Could not add admin user as board member: Admin user ID not found",
                );
            }
        } catch (error) {
            console.error(
                "Error adding admin user as board member:",
                error,
            );
        }

        // Create default lists and labels
        await createDefaultLists(board.id);
        await createDefaultLabels(board.id);

        return board;
    } catch (error) {
        throw new Error(
            `Failed to create board: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Retrieves all boards for a specific project
 *
 * @param {string} projectId - The ID of the project to get boards from
 * @returns {Promise<Array<object>>} Array of boards in the project
 * @throws {Error} If retrieving boards fails
 */
export async function getBoards(projectId: string) {
    try {
        // Get all projects which includes boards in the response
        const response = await plankaRequest(`/api/projects`);

        // Check if the response has the expected structure
        if (
            response &&
            typeof response === "object" &&
            "included" in response &&
            response.included &&
            typeof response.included === "object" &&
            "boards" in (response.included as Record<string, unknown>)
        ) {
            // Filter boards by projectId
            const allBoards =
                (response.included as Record<string, unknown>).boards;
            if (Array.isArray(allBoards)) {
                const filteredBoards = allBoards.filter((board) =>
                    typeof board === "object" &&
                    board !== null &&
                    "projectId" in board &&
                    board.projectId === projectId
                );
                return filteredBoards;
            }
        }

        // If we can't find boards in the expected format, return an empty array
        return [];
    } catch (error) {
        // If all else fails, return an empty array
        return [];
    }
}

/**
 * Retrieves a specific board by ID
 *
 * @param {string} id - The ID of the board to retrieve
 * @returns {Promise<object>} The requested board
 * @throws {Error} If retrieving the board fails
 */
export async function getBoard(id: string) {
    const response = await plankaRequest(`/api/boards/${id}`);
    const parsedResponse = BoardResponseSchema.parse(response);
    return parsedResponse.item;
}

/**
 * Updates a board's properties
 *
 * @param {string} id - The ID of the board to update
 * @param {Partial<Omit<CreateBoardOptions, "projectId">>} options - The properties to update
 * @returns {Promise<object>} The updated board
 * @throws {Error} If updating the board fails
 */
export async function updateBoard(
    id: string,
    options: Partial<Omit<CreateBoardOptions, "projectId">>,
) {
    const response = await plankaRequest(`/api/boards/${id}`, {
        method: "PATCH",
        body: options,
    });
    const parsedResponse = BoardResponseSchema.parse(response);
    return parsedResponse.item;
}

/**
 * Deletes a board by ID
 *
 * @param {string} id - The ID of the board to delete
 * @returns {Promise<{success: boolean}>} Success indicator
 * @throws {Error} If deleting the board fails
 */
export async function deleteBoard(id: string) {
    await plankaRequest(`/api/boards/${id}`, {
        method: "DELETE",
    });
    return { success: true };
}
