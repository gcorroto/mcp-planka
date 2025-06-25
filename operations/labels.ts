/**
 * @fileoverview Label operations for the MCP Kanban server
 *
 * This module provides functions for interacting with labels in the Planka Kanban board,
 * including creating, retrieving, updating, and deleting labels, as well as
 * adding and removing labels from cards.
 */

import { z } from "zod";
import { plankaRequest } from "../common/utils.js";
import { PlankaLabelSchema } from "../common/types.js";

/**
 * Valid color options for labels in Planka
 */
export const VALID_LABEL_COLORS = [
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
] as const;

/**
 * Schema for creating a new label
 * @property {string} boardId - The ID of the board to create the label in
 * @property {string} name - The name of the label
 * @property {string} color - The color of the label (must be one of the valid colors)
 * @property {number} [position] - The position of the label in the board (default: 65535)
 */
export const CreateLabelSchema = z.object({
    boardId: z.string().describe("Board ID"),
    name: z.string().describe("Label name"),
    color: z.enum(VALID_LABEL_COLORS).describe("Label color"),
    position: z.number().optional().describe("Label position (default: 65535)"),
});

/**
 * Schema for retrieving labels from a board
 * @property {string} boardId - The ID of the board to get labels from
 */
export const GetLabelsSchema = z.object({
    boardId: z.string().describe("Board ID"),
});

export const GetLabelSchema = z.object({
    id: z.string().describe("Label ID"),
});

/**
 * Schema for updating a label
 * @property {string} id - The ID of the label to update
 * @property {string} [name] - The new name for the label
 * @property {string} [color] - The new color for the label
 * @property {number} [position] - The new position for the label
 */
export const UpdateLabelSchema = z.object({
    id: z.string().describe("Label ID"),
    name: z.string().optional().describe("Label name"),
    color: z.enum(VALID_LABEL_COLORS).optional().describe("Label color"),
    position: z.number().optional().describe("Label position"),
});

/**
 * Schema for deleting a label
 * @property {string} id - The ID of the label to delete
 */
export const DeleteLabelSchema = z.object({
    id: z.string().describe("Label ID"),
});

/**
 * Schema for adding a label to a card
 * @property {string} cardId - The ID of the card to add the label to
 * @property {string} labelId - The ID of the label to add to the card
 */
export const AddLabelToCardSchema = z.object({
    cardId: z.string().describe("Card ID"),
    labelId: z.string().describe("Label ID"),
});

/**
 * Schema for removing a label from a card
 * @property {string} cardId - The ID of the card to remove the label from
 * @property {string} labelId - The ID of the label to remove from the card
 */
export const RemoveLabelFromCardSchema = z.object({
    cardId: z.string().describe("Card ID"),
    labelId: z.string().describe("Label ID"),
});

// Type exports
/**
 * Type definition for label creation options
 */
export type CreateLabelOptions = z.infer<typeof CreateLabelSchema>;

/**
 * Type definition for label update options
 */
export type UpdateLabelOptions = z.infer<typeof UpdateLabelSchema>;

/**
 * Type definition for adding a label to a card options
 */
export type AddLabelToCardOptions = z.infer<typeof AddLabelToCardSchema>;

/**
 * Type definition for removing a label from a card options
 */
export type RemoveLabelFromCardOptions = z.infer<
    typeof RemoveLabelFromCardSchema
>;

// Response schemas
const LabelsResponseSchema = z.object({
    items: z.array(PlankaLabelSchema),
    included: z.record(z.any()).optional(),
});

const LabelResponseSchema = z.object({
    item: PlankaLabelSchema,
    included: z.record(z.any()).optional(),
});

const CardLabelResponseSchema = z.object({
    item: z.object({
        id: z.string(),
        cardId: z.string(),
        labelId: z.string(),
        createdAt: z.string(),
        updatedAt: z.string().nullable(),
    }),
    included: z.record(z.any()).optional(),
});

// Function implementations
/**
 * Creates a new label in a board
 *
 * @param {CreateLabelOptions} options - Options for creating the label
 * @param {string} options.boardId - The ID of the board to create the label in
 * @param {string} options.name - The name of the label
 * @param {string} options.color - The color of the label
 * @param {number} [options.position] - The position of the label in the board (default: 65535)
 * @returns {Promise<object>} The created label
 * @throws {Error} If the label creation fails
 */
export async function createLabel(options: CreateLabelOptions) {
    try {
        const response = await plankaRequest(
            `/api/boards/${options.boardId}/labels`,
            {
                method: "POST",
                body: {
                    name: options.name,
                    color: options.color,
                    position: options.position,
                },
            },
        );
        const parsedResponse = LabelResponseSchema.parse(response);
        return parsedResponse.item;
    } catch (error) {
        throw new Error(
            `Failed to create label: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Retrieves all labels for a specific board
 *
 * @param {string} boardId - The ID of the board to get labels from
 * @returns {Promise<Array<object>>} Array of labels in the board
 */
export async function getLabels(boardId: string) {
    try {
        // Get the board which includes labels in the response
        const response = await plankaRequest(`/api/boards/${boardId}`);

        // Check if the response has the expected structure
        if (
            response &&
            typeof response === "object" &&
            "included" in response &&
            response.included &&
            typeof response.included === "object" &&
            "labels" in (response.included as Record<string, unknown>)
        ) {
            // Get the labels from the included property
            const labels =
                (response.included as Record<string, unknown>).labels;
            if (Array.isArray(labels)) {
                return labels;
            }
        }

        // If we can't find labels in the expected format, return an empty array
        return [];
    } catch (error) {
        // If all else fails, return an empty array
        return [];
    }
}

/**
 * Updates a label's properties
 *
 * @param {string} id - The ID of the label to update
 * @param {Partial<Omit<CreateLabelOptions, "boardId">>} options - The properties to update
 * @returns {Promise<object>} The updated label
 */
export async function updateLabel(
    id: string,
    options: Partial<Omit<CreateLabelOptions, "boardId">>,
) {
    try {
        const response = await plankaRequest(`/api/labels/${id}`, {
            method: "PATCH",
            body: options,
        });
        const parsedResponse = LabelResponseSchema.parse(response);
        return parsedResponse.item;
    } catch (error) {
        throw new Error(
            `Failed to update label: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Deletes a label by ID
 *
 * @param {string} id - The ID of the label to delete
 * @returns {Promise<{success: boolean}>} Success indicator
 */
export async function deleteLabel(id: string) {
    try {
        await plankaRequest(`/api/labels/${id}`, {
            method: "DELETE",
        });
        return { success: true };
    } catch (error) {
        throw new Error(
            `Failed to delete label: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Adds a label to a card
 *
 * @param {string} cardId - The ID of the card to add the label to
 * @param {string} labelId - The ID of the label to add to the card
 * @returns {Promise<object>} The created card-label relationship
 */
export async function addLabelToCard(cardId: string, labelId: string) {
    try {
        // The correct endpoint is /api/cards/{cardId}/labels with labelId in the body
        await plankaRequest(
            `/api/cards/${cardId}/labels`,
            {
                method: "POST",
                body: {
                    labelId,
                },
            },
        );

        return { success: true };
    } catch (error) {
        throw new Error(
            `Failed to add label to card: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Removes a label from a card
 *
 * @param {string} cardId - The ID of the card to remove the label from
 * @param {string} labelId - The ID of the label to remove from the card
 * @returns {Promise<{success: boolean}>} Success indicator
 */
export async function removeLabelFromCard(cardId: string, labelId: string) {
    try {
        // The correct endpoint is /api/cards/{cardId}/labels/{labelId}
        await plankaRequest(
            `/api/cards/${cardId}/labels/${labelId}`,
            {
                method: "DELETE",
            },
        );

        return { success: true };
    } catch (error) {
        throw new Error(
            `Failed to remove label from card: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}
