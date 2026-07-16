import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";

// Remove the video block spec entirely
const { video: _, ...remainingSpecs } = defaultBlockSpecs;

export const blogSchema = BlockNoteSchema.create({
  blockSpecs: remainingSpecs,
});
