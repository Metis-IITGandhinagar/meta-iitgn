import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { video, ...remainingSpecs } = defaultBlockSpecs;

export const blogSchema = BlockNoteSchema.create({
  blockSpecs: remainingSpecs,
});
