import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useCallback, useState } from "react";

export interface Story {
  id: string;
  user_id: string;
  seed: string;
  title: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoryNode {
  id: string;
  story_id: string;
  node_index: number;
  story_text: string;
  choice_made: string | null;
  image_url: string | null;
  narration_url: string | null;
  created_at: string;
}

export interface StoryChoice {
  id: string;
  node_id: string;
  choice_text: string;
  choice_index: number;
}

export function useStoryPersistence() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Create a new story
  const createStory = async (
    seed: string,
    title?: string
  ): Promise<Story | null> => {
    if (!user) return null;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("stories")
        .insert({
          user_id: user.id,
          seed,
          title: title || `Story: ${seed}`,
          is_completed: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err as Error);
      console.error("Error creating story:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Save a story node
  const saveStoryNode = async (
    storyId: string,
    nodeIndex: number,
    storyText: string,
    choiceMade: string | null,
    imageUrl?: string,
    narrationUrl?: string
  ): Promise<StoryNode | null> => {
    if (!user) return null;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("story_nodes")
        .insert({
          story_id: storyId,
          node_index: nodeIndex,
          story_text: storyText,
          choice_made: choiceMade,
          image_url: imageUrl || null,
          narration_url: narrationUrl || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Update the story's updated_at timestamp
      await supabase
        .from("stories")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", storyId);

      return data;
    } catch (err) {
      setError(err as Error);
      console.error("Error saving story node:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Save choices for a node
  const saveChoices = async (
    nodeId: string,
    choices: string[]
  ): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      const choiceInserts = choices.map((choice, index) => ({
        node_id: nodeId,
        choice_text: choice,
        choice_index: index,
      }));

      const { error } = await supabase
        .from("story_choices")
        .insert(choiceInserts);

      if (error) throw error;
      return true;
    } catch (err) {
      setError(err as Error);
      console.error("Error saving choices:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get user's stories
  const getUserStories = useCallback(async (): Promise<Story[]> => {
    console.log("[useStoryPersistence] getUserStories called, user:", user);
    if (!user) {
      console.log("[useStoryPersistence] No user, returning empty array");
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      console.log("[useStoryPersistence] Fetching stories for user:", user.id);
      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      console.log("[useStoryPersistence] Stories fetched:", data, "error:", error);
      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err as Error);
      console.error("[useStoryPersistence] Error fetching stories:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Get a specific story with all its nodes and choices
  const getStoryWithNodes = useCallback(
    async (storyId: string) => {
      if (!user) return null;

      setLoading(true);
      setError(null);

      try {
        // Get the story
        const { data: story, error: storyError } = await supabase
          .from("stories")
          .select("*")
          .eq("id", storyId)
          .eq("user_id", user.id)
          .single();

        if (storyError) throw storyError;

        // Get all nodes for this story
        const { data: nodes, error: nodesError } = await supabase
          .from("story_nodes")
          .select(
            `
          *,
          story_choices (*)
        `
          )
          .eq("story_id", storyId)
          .order("node_index", { ascending: true });

        if (nodesError) throw nodesError;

        return {
          story,
          nodes: nodes || [],
        };
      } catch (err) {
        setError(err as Error);
        console.error("Error fetching story with nodes:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Mark a story as completed
  const markStoryCompleted = async (storyId: string): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("stories")
        .update({
          is_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", storyId)
        .eq("user_id", user.id);

      if (error) throw error;
      return true;
    } catch (err) {
      setError(err as Error);
      console.error("Error marking story completed:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete a story and all its associated data
  const deleteStory = async (storyId: string): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      // Due to cascade delete, this will also delete all nodes and choices
      const { error } = await supabase
        .from("stories")
        .delete()
        .eq("id", storyId)
        .eq("user_id", user.id);

      if (error) throw error;
      return true;
    } catch (err) {
      setError(err as Error);
      console.error("Error deleting story:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update node assets (image/narration URLs)
  const updateNodeAssets = useCallback(
    async (
      nodeId: string,
      updates: { image_url?: string; narration_url?: string }
    ) => {
      try {
        const { error } = await supabase
          .from("story_nodes")
          .update(updates)
          .eq("id", nodeId);

        if (error) throw error;
        return true;
      } catch (error) {
        console.error(
          "[useStoryPersistence] Error updating node assets:",
          error
        );
        return false;
      }
    },
    []
  );

  // Save node with choices (combines saveStoryNode and saveChoices)
  const saveNode = useCallback(
    async ({
      currentStoryId,
      nodeIndex,
      story,
      choiceMade,
      choices,
      imageUrl,
      narrationUrl,
    }: {
      currentStoryId: string;
      nodeIndex: number;
      story: string;
      choiceMade: string | null;
      choices?: string[];
      imageUrl?: string;
      narrationUrl?: string;
    }) => {
      try {
        // Save the node
        const node = await saveStoryNode(
          currentStoryId,
          nodeIndex,
          story,
          choiceMade,
          imageUrl,
          narrationUrl
        );

        if (node) {
          // Save choices for this node if any
          if (choices && choices.length > 0) {
            await saveChoices(node.id, choices);
          }

          return node;
        }
      } catch (error) {
        console.error("[useStoryPersistence] Error saving node:", error);
      }
      return null;
    },
    [saveStoryNode, saveChoices]
  );

  // Load story data (for useStoryLoader functionality)
  const loadStoryData = useCallback(
    async (storyId: string) => {
      if (!storyId) return null;

      try {
        const storyData = await getStoryWithNodes(storyId);
        if (storyData) {
          const loadedSteps: Array<{ story: string; choice: string | null }> =
            [];
          const loadedHistory: string[] = [];
          const loadedNodeIds: string[] = [];
          const nodeDataMap = new Map();

          // Sort nodes by index to ensure correct order
          const sortedNodes = [...storyData.nodes].sort(
            (a, b) => a.node_index - b.node_index
          );

          sortedNodes.forEach((node) => {
            loadedSteps.push({
              story: node.story_text,
              choice: node.choice_made,
            });
            if (node.choice_made) {
              loadedHistory.push(node.choice_made);
            }
            loadedNodeIds.push(node.id);
            // Store additional node data (like image URLs)
            nodeDataMap.set(node.node_index, {
              imageUrl: node.image_url,
              narrationUrl: node.narration_url,
            });
          });

          // Get choices from the last node
          let lastNodeChoices: string[] = [];
          if (sortedNodes.length > 0) {
            const lastNode = sortedNodes[sortedNodes.length - 1];
            if (lastNode.story_choices && lastNode.story_choices.length > 0) {
              lastNodeChoices = lastNode.story_choices
                .sort((a: any, b: any) => a.choice_index - b.choice_index)
                .map((choice: any) => choice.choice_text);
            }
          }

          return {
            steps: loadedSteps,
            history: loadedHistory,
            nodeIds: loadedNodeIds,
            nodeDataMap,
            choices: lastNodeChoices,
            storyId,
          };
        }
      } catch (error) {
        console.error("[useStoryPersistence] Error loading story:", error);
      }
      return null;
    },
    [getStoryWithNodes]
  );

  return {
    loading,
    error,
    createStory,
    saveStoryNode,
    saveChoices,
    getUserStories,
    getStoryWithNodes,
    markStoryCompleted,
    deleteStory,
    updateNodeAssets,
    saveNode,
    loadStoryData,
  };
}
