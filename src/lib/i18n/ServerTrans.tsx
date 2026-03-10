import React, { cloneElement, Fragment, isValidElement } from "react";
import { getT } from "./server";

/**
 * Get a nested value from an object using dot-separated key path.
 */
function getByPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/** Same regex as next-translate formatElements: paired <tag>...</tag> or self-closing <tag /> ([\s\S] = any char including newline) */
const TAG_REGEX = /<(\w+) *>([\s\S]*?)<\/\1 *>|<(\w+) *\/>/g;

type ServerTransProps = {
  i18nKey: string;
  components?: Record<string, React.ReactElement>;
};

/**
 * Server-side Trans: resolves i18n key from our strings, parses <tag>content</tag>
 * and renders the matching component with that content as children.
 * Use this in Server Components instead of next-translate's Trans.
 */
export async function ServerTrans({
  i18nKey,
  components = {},
}: ServerTransProps): Promise<React.ReactElement> {
  const t = await getT();
  const str = getByPath(t as Record<string, unknown>, i18nKey);
  if (typeof str !== "string") {
    return <>{i18nKey}</>;
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const re = new RegExp(TAG_REGEX.source, TAG_REGEX.flags);
  re.lastIndex = 0;

  while ((match = re.exec(str)) !== null) {
    const [, pairedTag, pairedContent, selfClosingTag] = match;
    const tag = pairedTag || selfClosingTag;
    const before = str.slice(lastIndex, match.index);
    if (before) parts.push(before);

    const element = components[tag];
    if (isValidElement(element)) {
      const content = pairedContent ?? "";
      parts.push(cloneElement(element, { key: parts.length }, content));
    } else {
      if (pairedContent !== undefined) parts.push(pairedContent);
    }
    lastIndex = re.lastIndex;
  }

  const tail = str.slice(lastIndex);
  if (tail) parts.push(tail);

  return <Fragment>{parts}</Fragment>;
}
