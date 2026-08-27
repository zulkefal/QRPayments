/**
 * The payload is a flat run of Tag-Length-Value fields: a 2-digit tag,
 * a 2-digit length, then that many characters. No separators — a reader
 * walks it by counting.
 */
export function encodeField(tag, value) {
  const text = String(value);

  if (!/^\d{2}$/.test(tag)) {
    throw new RangeError(`tag must be two digits, got ${tag}`);
  }
  if (text.length > 99) {
    throw new RangeError(`field ${tag} is ${text.length} chars, max is 99`);
  }

  return tag + String(text.length).padStart(2, "0") + text;
}

/** Walk a payload into [{tag, length, value}]. Throws on a malformed run. */
export function decodeFields(payload) {
  const fields = [];
  let cursor = 0;

  while (cursor < payload.length) {
    if (cursor + 4 > payload.length) {
      throw new SyntaxError(`truncated header at offset ${cursor}`);
    }

    const tag = payload.slice(cursor, cursor + 2);
    const rawLength = payload.slice(cursor + 2, cursor + 4);

    if (!/^\d{2}$/.test(rawLength)) {
      throw new SyntaxError(`bad length "${rawLength}" for tag ${tag}`);
    }

    const length = Number(rawLength);
    const value = payload.slice(cursor + 4, cursor + 4 + length);

    if (value.length !== length) {
      throw new SyntaxError(`tag ${tag} claims ${length} chars, found ${value.length}`);
    }

    fields.push({ tag, length, value });
    cursor += 4 + length;
  }

  return fields;
}
