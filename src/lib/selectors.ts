
export function isEmbedBlock(node: Node): boolean {
  const element = node as HTMLElement;
  const isTopLevelBlock = element.parentNode?.nodeName === 'BODY';
  const wpType = element?.dataset?.['wpType'];

  if (!isTopLevelBlock || !wpType || wpType !== 'embed') {
    return false;
  }

  return true;
}

export function isGalleryBlock(node: Node): boolean {
  const element = node as HTMLElement;
  const isTopLevelBlock = element.parentNode?.nodeName === 'BODY';
  const wpType = element?.dataset?.['wpType'];

  if (!isTopLevelBlock || !wpType || wpType !== 'gallery') {
    return false;
  }

  return true;
}

export function isImageBlock(node: Node): boolean {
  const element = node as HTMLElement;
  const isTopLevelBlock = element.parentNode?.nodeName === 'BODY';
  const wpType = element?.dataset?.['wpType'];

  if (!isTopLevelBlock || !wpType || wpType !== 'image') {
    return false;
  }

  return true;
}

export function isCodeBlock(node: Node): boolean {
  const element = node as HTMLElement;
  const isTopLevelBlock = element.parentNode?.nodeName === 'BODY';
  const wpType = element?.dataset?.['wpType'];

  if (!isTopLevelBlock || element.nodeName !== 'PRE') {
    return false;
  }

  return true;
}