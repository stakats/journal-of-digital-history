import MarkdownIt from 'markdown-it'
import Cite from 'citation-js'

import ArticleTree from '../models/ArticleTree'
import ArticleHeading from '../models/ArticleHeading'
import ArticleCell from '../models/ArticleCell'

import MarkdownItAttrs from '@gerhobbelt/markdown-it-attrs'

const markdownParser = MarkdownIt({
  html: false,
  linkify: true,
  typographer: true
})

markdownParser.use(MarkdownItAttrs, {
  // optional, these are default options
  leftDelimiter: '{',
  rightDelimiter: '}',
  allowedAttributes: ['class']  // empty array = all attributes are allowed
});

const getArticleTreeFromIpynb = ({ cells=[], metadata={} }) => {
  console.info('getArticleTreeFromIpynb', cells)
  const headings = [];
  const paragraphs = [];
  let bibliography = null;
  const citationsFromMetadata = metadata?.cite2c?.citations;
  // parse biobliographic elements
  if (citationsFromMetadata instanceof Object) {
    bibliography = new Cite(Object.values(citationsFromMetadata))
  }
  cells.forEach((cell, idx) => {
    // console.info(p.cell_type, idx)
    if (cell.cell_type === 'markdown') {
       const tokens = markdownParser.parse(cell.source.join('\n\n'));
       const content = markdownParser.render(cell.source.join('\n\n'))
       // get tokens 'heading_open' to get all h1,h2,h3 etc...
       const headerIdx = tokens.findIndex(t => t.type === 'heading_open');
       if (headerIdx > -1) {
         headings.push(new ArticleHeading({
           tag: tokens[headerIdx].tag,
           content: tokens[headerIdx + 1].content,
           idx
         }))
       }
       paragraphs.push(new ArticleCell({
         type: 'markdown',
         content,
         source: cell.source,
         metadata: cell.metadata,
         idx,
       }))
    } else if (cell.cell_type === 'code') {
      paragraphs.push(new ArticleCell({
        type: 'code',
        content: cell.source.join(''),
        source: cell.source,
        metadata: cell.metadata,
        idx,
        outputs: cell.outputs,
      }))
    }
  })
  return new ArticleTree({ headings, paragraphs, bibliography })
}

export {
  markdownParser,
  getArticleTreeFromIpynb
}
