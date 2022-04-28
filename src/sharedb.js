import ShareDB from "sharedb";
import richText from "rich-text";

ShareDB.types.register(richText.type);

export const backend = new ShareDB();

export const docs = new Map();

const { Client } = require('@elastic/elasticsearch')
require('dotenv').config();

export const elastic = new Client({
  cloud: {
    id: process.env.CLOUD_ID
  },
  auth: {
    apiKey: process.env.ENCODED_API_KEY
  }
})

