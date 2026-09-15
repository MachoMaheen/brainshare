import { createUlid } from "@brainshare/core";
import { isUlid } from "@brainshare/protocol";

/** Obsidian adapter over BrainShare's editor-neutral stable identity primitive. */
export const ulid = createUlid;
export const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;
export const isValidUlid = isUlid;
