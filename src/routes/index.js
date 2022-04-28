import express from "express";
import { elastic } from "../sharedb";
const router = express.Router();


router.get("/search", async (req, res) => {
  
  const result = await client.search({
    index: 'cse356',
    query: {
      multi_match: {
        query: req.query.q,
        type: "phrase", 
        fields: ["name^2", "text"] 
      },
      highlight: {
        fields: {
          text: {}
        },
        no_match_size: 100,
        number_of_fragments: 1
      }
    
    }
  })
  const output = result.hits.hits.map((hit)=>({
    docid: hit._id,
    name: hit._source.name,
    snippet: hit.highlight
  }))

  return res.status(200).json(output);
});
// may fail for edit distance greater than 2
router.get("/suggest", async (req, res) => {
  
  const result = await client.search({
    index: 'cse356',
    suggest: {
      suggestion: {
        text: req.query.q,
        term: {
          field: "text",
          prefix_length: req.query.q.length
        }
      }
    }
  })
  const output = result.suggest.suggestion.options.map((option)=>(option.text))

  return res.status(200).json(output);
});

export default router;
