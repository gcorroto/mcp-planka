import { z } from "zod";
import { getCard } from "../operations/cards.js";
import { getTasks } from "../operations/tasks.js";
import { getComments } from "../operations/comments.js";
import { getLabels } from "../operations/labels.js";
import { getProjects } from "../operations/projects.js";
import { getBoards } from "../operations/boards.js";
import { getLists } from "../operations/lists.js";

/**
 * Zod schema for the getCardDetails function parameters
 * @property {string} cardId - The ID of the card to get details for
 */
export const getCardDetailsSchema = z.object({
    cardId: z.string().describe("The ID of the card to get details for"),
});

/**
 * Type definition for getCardDetails parameters
 */
export type GetCardDetailsParams = z.infer<typeof getCardDetailsSchema>;

/**
 * Retrieves comprehensive details about a card including tasks, comments, labels, and analysis
 *
 * This function aggregates data from multiple sources to provide a complete view of a card,
 * including its tasks, comments, and labels. It also calculates task completion percentage
 * and performs analysis on the card's status.
 *
 * @param {GetCardDetailsParams} params - Parameters for retrieving card details
 * @param {string} params.cardId - The ID of the card to get details for
 * @returns {Promise<object>} Comprehensive card details including tasks, comments, labels, and analysis
 * @throws {Error} If the card is not found or if the board ID cannot be determined
 */
export async function getCardDetails(params: GetCardDetailsParams) {
    const { cardId } = params;

    try {
        // Get the card details
        const card = await getCard(cardId);

        if (!card) {
            throw new Error(`Card with ID ${cardId} not found`);
        }

        // Get tasks for the card
        const tasks = await getTasks(card.id);

        // Get comments for the card
        const comments = await getComments(card.id);

        // Find the board ID by searching through all projects and boards
        let boardId = null;

        // Get all projects
        const projectsResponse = await getProjects(1, 100);
        const projects = projectsResponse.items;

        // For each project, get its boards
        for (const project of projects) {
            if (boardId) break; // Stop if we already found the board ID

            const boards = await getBoards(project.id);

            // For each board, get its lists
            for (const board of boards) {
                if (boardId) break; // Stop if we already found the board ID

                const lists = await getLists(board.id);

                // Check if the card's list ID is in this board
                const matchingList = lists.find((list: any) =>
                    list.id === card.listId
                );

                if (matchingList) {
                    boardId = board.id;
                    break;
                }
            }
        }

        if (!boardId) {
            throw new Error(`Could not determine board ID for card ${cardId}`);
        }

        const labels = await getLabels(boardId);

        // Filter to just the labels assigned to this card
        // Note: We need to get the labelIds from the card's data
        // This might require additional API calls or data structure knowledge
        // For now, we'll return all labels for the board

        // Calculate task completion percentage
        const completedTasks = tasks.filter((task: any) =>
            task.isCompleted
        ).length;
        const totalTasks = tasks.length;
        const completionPercentage = totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0;

        // Sort comments by date (newest first)
        const sortedComments = comments.sort((a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Check if the most recent comment is likely from a human (not the LLM)
        // This is a heuristic and might need adjustment
        const hasRecentHumanFeedback = sortedComments.length > 0 &&
            sortedComments[0].data &&
            !sortedComments[0].data.text.includes("Implemented feature") &&
            !sortedComments[0].data.text.includes("Awaiting human review");

        return {
            card,
            taskItems: tasks,
            taskStats: {
                total: totalTasks,
                completed: completedTasks,
                completionPercentage,
            },
            comments: sortedComments,
            labels,
            analysis: {
                hasRecentHumanFeedback,
                isComplete: completionPercentage === 100,
                needsAttention: hasRecentHumanFeedback || completedTasks === 0,
            },
        };
    } catch (error) {
        console.error("Error in getCardDetails:", error);
        throw error;
    }
}
