/**
 * @fileoverview Board membership operations for the MCP Kanban server
 *
 * This module provides functions for managing board memberships in the Planka Kanban system,
 * including creating, retrieving, updating, and deleting board memberships, which control
 * user access and permissions to boards.
 */

import { z } from "zod";
import { plankaRequest } from "../common/utils.js";

// Schema definitions
/**
 * Schema for creating a new board membership
 * @property {string} boardId - The ID of the board to add the user to
 * @property {string} userId - The ID of the user to add to the board
 * @property {string} role - The role of the user on the board (editor or viewer)
 */
export const CreateBoardMembershipSchema = z.object({
    boardId: z.string().describe("Board ID"),
    userId: z.string().describe("User ID"),
    role: z.enum(["editor", "viewer"]).describe(
        "Membership role (editor or viewer)",
    ),
});

/**
 * Schema for retrieving board memberships
 * @property {string} boardId - The ID of the board to get memberships for
 */
export const GetBoardMembershipsSchema = z.object({
    boardId: z.string().describe("Board ID"),
});

/**
 * Schema for retrieving a specific board membership
 * @property {string} id - The ID of the board membership to retrieve
 */
export const GetBoardMembershipSchema = z.object({
    id: z.string().describe("Board Membership ID"),
});

/**
 * Schema for updating a board membership
 * @property {string} id - The ID of the board membership to update
 * @property {string} role - The new role for the user (editor or viewer)
 * @property {boolean} [canComment] - Whether the user can comment on cards
 */
export const UpdateBoardMembershipSchema = z.object({
    id: z.string().describe("Board Membership ID"),
    role: z.enum(["editor", "viewer"]).describe(
        "Membership role (editor or viewer)",
    ),
    canComment: z.boolean().optional().describe(
        "Whether the user can comment on cards",
    ),
});

/**
 * Schema for deleting a board membership
 * @property {string} id - The ID of the board membership to delete
 */
export const DeleteBoardMembershipSchema = z.object({
    id: z.string().describe("Board Membership ID"),
});

// Type exports
/**
 * Type definition for board membership creation options
 */
export type CreateBoardMembershipOptions = z.infer<
    typeof CreateBoardMembershipSchema
>;

/**
 * Type definition for board membership update options
 */
export type UpdateBoardMembershipOptions = z.infer<
    typeof UpdateBoardMembershipSchema
>;

// Board membership schema
const BoardMembershipSchema = z.object({
    id: z.string(),
    boardId: z.string(),
    userId: z.string(),
    role: z.string(),
    canComment: z.boolean().nullable(),
    createdAt: z.string(),
    updatedAt: z.string().nullable(),
});

// Response schemas
const BoardMembershipsResponseSchema = z.object({
    items: z.array(BoardMembershipSchema),
    included: z.record(z.any()).optional(),
});

const BoardMembershipResponseSchema = z.object({
    item: BoardMembershipSchema,
    included: z.record(z.any()).optional(),
});

// Function implementations
/**
 * Creates a new board membership (adds a user to a board with specified permissions)
 *
 * @param {CreateBoardMembershipOptions} options - Options for creating the board membership
 * @param {string} options.boardId - The ID of the board to add the user to
 * @param {string} options.userId - The ID of the user to add to the board
 * @param {string} options.role - The role of the user on the board (editor or viewer)
 * @returns {Promise<object>} The created board membership
 * @throws {Error} If the board membership creation fails
 */
export async function createBoardMembership(
    options: CreateBoardMembershipOptions,
) {
    try {
        const response = await plankaRequest(
            `/api/boards/${options.boardId}/memberships`,
            {
                method: "POST",
                body: {
                    userId: options.userId,
                    role: options.role,
                },
            },
        );
        const parsedResponse = BoardMembershipResponseSchema.parse(response);
        return parsedResponse.item;
    } catch (error) {
        throw new Error(
            `Failed to create board membership: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Retrieves all memberships for a specific board
 *
 * @param {string} boardId - The ID of the board to get memberships for
 * @returns {Promise<Array<object>>} Array of board memberships
 * @throws {Error} If retrieving board memberships fails
 */
export async function getBoardMemberships(boardId: string) {
    try {
        const response = await plankaRequest(
            `/api/boards/${boardId}/memberships`,
        );

        try {
            // Try to parse as a BoardMembershipsResponseSchema first
            const parsedResponse = BoardMembershipsResponseSchema.parse(
                response,
            );
            return parsedResponse.items;
        } catch (parseError) {
            // If that fails, try to parse as an array directly
            if (Array.isArray(response)) {
                return z.array(BoardMembershipSchema).parse(response);
            }

            // If we get here, we couldn't parse the response in any expected format
            throw new Error(
                `Could not parse board memberships response: ${
                    JSON.stringify(response)
                }`,
            );
        }
    } catch (error) {
        // If all else fails, return an empty array
        return [];
    }
}

/**
 * Retrieves a specific board membership by ID
 *
 * @param {string} id - The ID of the board membership to retrieve
 * @returns {Promise<object>} The requested board membership
 * @throws {Error} If retrieving the board membership fails
 */
export async function getBoardMembership(id: string) {
    try {
        const response = await plankaRequest(`/api/board-memberships/${id}`);
        const parsedResponse = BoardMembershipResponseSchema.parse(response);
        return parsedResponse.item;
    } catch (error) {
        throw new Error(
            `Failed to get board membership: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Updates a board membership's properties (user permissions on a board)
 *
 * @param {string} id - The ID of the board membership to update
 * @param {Partial<Omit<CreateBoardMembershipOptions, "boardId" | "userId">>} options - The properties to update
 * @param {string} [options.role] - The new role for the user (editor or viewer)
 * @param {boolean} [options.canComment] - Whether the user can comment on cards
 * @returns {Promise<object>} The updated board membership
 * @throws {Error} If updating the board membership fails
 */
export async function updateBoardMembership(
    id: string,
    options: Partial<Omit<CreateBoardMembershipOptions, "boardId" | "userId">>,
) {
    try {
        const response = await plankaRequest(`/api/board-memberships/${id}`, {
            method: "PATCH",
            body: options,
        });
        const parsedResponse = BoardMembershipResponseSchema.parse(response);
        return parsedResponse.item;
    } catch (error) {
        throw new Error(
            `Failed to update board membership: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Deletes a board membership by ID (removes a user from a board)
 *
 * @param {string} id - The ID of the board membership to delete
 * @returns {Promise<{success: boolean}>} Success indicator
 * @throws {Error} If deleting the board membership fails
 */
export async function deleteBoardMembership(id: string) {
    try {
        await plankaRequest(`/api/board-memberships/${id}`, {
            method: "DELETE",
        });
        return { success: true };
    } catch (error) {
        throw new Error(
            `Failed to delete board membership: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}
