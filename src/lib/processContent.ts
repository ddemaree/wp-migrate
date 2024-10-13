import { JSDOM } from 'jsdom';

function getNodeTypeName(dom: JSDOM, node: Node) {
  switch (node.nodeType) {
    case dom.window.Node.ELEMENT_NODE:
      return 'Element';
    case dom.window.Node.TEXT_NODE:
      return 'Text';
    case dom.window.Node.COMMENT_NODE:
      return 'Comment';
    default:
      return 'Unknown';
  }
}

function namedNodeMapToObject(nodeMap: NamedNodeMap) {
  const obj: Record<string, string> = {};
  for (let i = 0; i < nodeMap.length; i++) {
    const node = nodeMap.item(i);
    if (node) {
      obj[node.name] = node.value;
    }
  }
  return obj;
}

function parseWPCommentData(data: string) {
  // Parse the comment - <!-- wp:image {...json} -->
  const wpPrefix = ' wp:';
  const type = data.slice(wpPrefix.length, data.indexOf(' ', wpPrefix.length));
  const jsonStartIndex = data.indexOf('{');
  const jsonEndIndex = data.lastIndexOf('}') + 1;

  let blockData: Record<string, any> | null = null;
  if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
    const jsonStr = data.slice(jsonStartIndex, jsonEndIndex);
    blockData = { ...JSON.parse(jsonStr), _type: type };
  } else {
    blockData = { _type: type };
  }
  
  return blockData;
}

export function processGutenbergContent(content: string, _outputDir: string, slug: string): Document {
  const dom = new JSDOM(content, {
    url: `https://demaree.me/p/${slug}`,
  });
  const document = dom.window.document;

  var nodeIterator = document.createNodeIterator(
    dom.window.document.body,
    dom.window.NodeFilter.SHOW_ALL,
    (node) => dom.window.NodeFilter.FILTER_ACCEPT
  )

  let node: Node | null = null;
  let blockStack: Record<string, any>[] = [];
  let currentBlock: Record<string, any> | null = null;
  while ((node = nodeIterator.nextNode())) {
    if (node.nodeType === dom.window.Node.COMMENT_NODE) {
      let comment = node as Comment;

      // If comment is not self-closing, set as current block
      if (comment?.data?.startsWith(' wp:') && !comment?.data?.endsWith(' /')) {
        const blockData = parseWPCommentData(comment.data);
        if (blockData) {
          blockStack.push(blockData);
          currentBlock = blockData;
        }
        // Remove the node
        node.parentNode?.removeChild(node);
      } else if (comment?.data?.startsWith(' /wp:')) {
        blockStack.pop();
        currentBlock = blockStack.length > 0 ? (blockStack[blockStack.length - 1] as any) : null;
        node.parentNode?.removeChild(node);
      }
    }

    if (node.nodeType === dom.window.Node.ELEMENT_NODE) {
      const element = node as HTMLElement;

      const isTopLevelBlock = element.parentNode?.nodeName === 'BODY';

      if (isTopLevelBlock && currentBlock) {
        element.dataset['wpType'] = currentBlock._type;

        // If there's another block in the stack, add a wpParentType data attr
        if (blockStack.length > 0) {
          element.dataset['wpParentType'] = blockStack[blockStack.length - 1]?._type;
        }
      }

      if (element.nodeName === 'FIGURE') {
        // Set data attributes from current block data
        if (currentBlock) {
          for (const [key, value] of Object.entries(currentBlock)) {
            // element.setAttribute(key, value);
            if (!key.startsWith('_')) {
              (element as any).dataset[key] = value;
            }
          }
        }
      }
    }
  }

  // Process blocks
  return document;
}
