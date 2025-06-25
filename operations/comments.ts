/**
 * @fileoverview Comment operations for the MCP Kanban server
 *
 * This module provides functions for interacting with comments in the Planka Kanban board,
 * including creating, retrieving, updating, and deleting comments on cards.
 */

import { z } from "zod";
import { plankaRequest } from "../common/utils.js";

// Schema definitions
/**
 * Schema for creating a new comment
 * @property {string} cardId - The ID of the card to create the comment on
 * @property {string} text - The text content of the comment
 */
export const CreateCommentSchema = z.object({
    cardId: z.string().describe("Card ID"),
    text: z.string().describe("Comment text"),
});

/**
 * Schema for retrieving comments from a card
 * @property {string} cardId - The ID of the card to get comments from
 */
export const GetCommentsSchema = z.object({
    cardId: z.string().describe("Card ID"),
});

/**
 * Schema for retrieving a specific comment
 * @property {string} id - The ID of the comment to retrieve
 */
export const GetCommentSchema = z.object({
    id: z.string().describe("Comment ID"),
});

/**
 * Schema for updating a comment
 * @property {string} id - The ID of the comment to update
 * @property {string} text - The new text content for the comment
 */
export const UpdateCommentSchema = z.object({
    id: z.string().describe("Comment ID"),
    text: z.string().describe("Comment text"),
});

/**
 * Schema for deleting a comment
 * @property {string} id - The ID of the comment to delete
 */
export const DeleteCommentSchema = z.object({
    id: z.string().describe("Comment ID"),
});

// Type exports
/**
 * Type definition for comment creation options
 */
export type CreateCommentOptions = z.infer<typeof CreateCommentSchema>;

/**
 * Type definition for comment update options
 */
export type UpdateCommentOptions = z.infer<typeof UpdateCommentSchema>;

// Comment action schema
const CommentActionSchema = z.object({
    id: z.string(),
    type: z.literal("commentCard"),
    data: z.object({
        text: z.string(),
    }),
    cardId: z.string(),
    userId: z.string(),
    createdAt: z.string(),
    updatedAt: z.string().nullable(),
});

// Response schemas
const CommentActionsResponseSchema = z.object({
    items: z.array(CommentActionSchema),
    included: z.record(z.any()).optional(),
});

const CommentActionResponseSchema = z.object({
    item: CommentActionSchema,
    included: z.record(z.any()).optional(),
});

// Function implementations
/**
 * Creates a new comment on a card
 *
 * @param {CreateCommentOptions} options - Options for creating the comment
 * @param {string} options.cardId - The ID of the card to create the comment on
 * @param {string} options.text - The text content of the comment
 * @returns {Promise<object>} The created comment
 * @throws {Error} If the comment creation fails
 */
export async function createComment(options: CreateCommentOptions) {
    try {
        const response = await plankaRequest(
            `/api/cards/${options.cardId}/comment-actions`,
            {
                method: "POST",
                body: {
                    text: options.text,
                },
            },
        );
        const parsedResponse = CommentActionResponseSchema.parse(response);
        return parsedResponse.item;
    } catch (error) {
        throw new Error(
            `Failed to create comment: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Retrieves all comments for a specific card
 *
 * @param {string} cardId - The ID of the card to get comments for
 * @returns {Promise<Array<object>>} Array of comments on the card
 * @throws {Error} If retrieving comments fails
 */
export async function getComments(cardId: string) {
    try {
        const response = await plankaRequest(`/api/cards/${cardId}/actions`);

        try {
            // Try to parse as a CommentsResponseSchema first
            const parsedResponse = CommentActionsResponseSchema.parse(response);
            // Filter only comment actions
            if (parsedResponse.items && Array.isArray(parsedResponse.items)) {
                return parsedResponse.items.filter((item) =>
                    item.type === "commentCard"
                );
            }
            return parsedResponse.items;
        } catch (parseError) {
            // If that fails, try to parse as an array directly
            if (Array.isArray(response)) {
                const items = z.array(CommentActionSchema).parse(response);
                // Filter only comment actions
                return items.filter((item) => item.type === "commentCard");
            }

            // If we get here, we couldn't parse the response in any expected format
            throw new Error(
                `Could not parse comments response: ${
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
 * Retrieves a specific comment by ID
 *
 * @param {string} id - The ID of the comment to retrieve
 * @returns {Promise<object>} The requested comment
 * @throws {Error} If retrieving the comment fails
 */
export async function getComment(id: string) {
    try {
        // Get all projects which includes boards
        const projectsResponse = await plankaRequest(`/api/projects`);

        if (
            !projectsResponse ||
            typeof projectsResponse !== "object" ||
            !("included" in projectsResponse) ||
            !projectsResponse.included ||
            typeof projectsResponse.included !== "object"
        ) {
            throw new Error("Failed to get projects");
        }

        const included = projectsResponse.included as Record<string, unknown>;

        // Get all boards
        if (!("boards" in included) || !Array.isArray(included.boards)) {
            throw new Error("No boards found");
        }

        const boards = included.boards;

        // Check each board for cards
        for (const board of boards) {
            if (
                typeof board !== "object" || board === null || !("id" in board)
            ) {
                continue;
            }

            const boardId = board.id as string;

            // Get the board details which includes cards
            const boardResponse = await plankaRequest(`/api/boards/${boardId}`);

            if (
                !boardResponse ||
                typeof boardResponse !== "object" ||
                !("included" in boardResponse) ||
                !boardResponse.included ||
                typeof boardResponse.included !== "object"
            ) {
                continue;
            }

            const boardIncluded = boardResponse.included as Record<
                string,
                unknown
            >;

            if (
                !("cards" in boardIncluded) ||
                !Array.isArray(boardIncluded.cards)
            ) {
                continue;
            }

            const cards = boardIncluded.cards;

            // Check each card for the comment
            for (const card of cards) {
                if (
                    typeof card !== "object" || card === null || !("id" in card)
                ) {
                    continue;
                }

                const cardId = card.id as string;

                // Get the card actions
                const actionsResponse = await plankaRequest(
                    `/api/cards/${cardId}/actions`,
                );

                if (
                    !actionsResponse ||
                    typeof actionsResponse !== "object" ||
                    !("items" in actionsResponse) ||
                    !Array.isArray(actionsResponse.items)
                ) {
                    continue;
                }

                const actions = actionsResponse.items;

                // Find the comment with the matching ID
                const comment = actions.find((action) =>
                    typeof action === "object" &&
                    action !== null &&
                    "id" in action &&
                    action.id === id &&
                    "type" in action &&
                    action.type === "commentCard"
                );

                if (comment) {
                    return comment;
                }
            }
        }

        throw new Error(`Comment not found: ${id}`);
    } catch (error) {
        throw new Error(
            `Failed to get comment: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Updates a comment's text content
 *
 * @param {string} id - The ID of the comment to update
 * @param {Partial<Omit<CreateCommentOptions, "cardId">>} options - The properties to update
 * @param {string} options.text - The new text content for the comment
 * @returns {Promise<object>} The updated comment
 * @throws {Error} If updating the comment fails
 */
export async function updateComment(
    id: string,
    options: Partial<Omit<CreateCommentOptions, "cardId">>,
) {
    try {
        const response = await plankaRequest(`/api/comment-actions/${id}`, {
            method: "PATCH",
            body: {
                text: options.text,
            },
        });
        const parsedResponse = CommentActionResponseSchema.parse(response);
        return parsedResponse.item;
    } catch (error) {
        throw new Error(
            `Failed to update comment: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Deletes a comment by ID
 *
 * @param {string} id - The ID of the comment to delete
 * @returns {Promise<{success: boolean}>} Success indicator
 * @throws {Error} If deleting the comment fails
 */
export async function deleteComment(id: string) {
    try {
        await plankaRequest(`/api/comment-actions/${id}`, {
            method: "DELETE",
        });
        return { success: true };
    } catch (error) {
        throw new Error(
            `Failed to delete comment: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}
