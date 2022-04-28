import ShareDB from "sharedb";
import richText from "rich-text";

ShareDB.types.register(richText.type);

export const backend = new ShareDB();

export const docs = new Map();
