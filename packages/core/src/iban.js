/** Pakistani IBAN: PK + 2 check digits + 4-letter bank code + 16 alphanumeric. */
const PK_IBAN = /^PK\d{2}[A-Z]{4}[A-Z0-9]{16}$/;

export function normalizeIban(value) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, "").toUpperCase();
}

/** ISO 7064 MOD-97-10, computed digit by digit to avoid BigInt. */
function mod97(iban) {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;

  for (const char of rearranged) {
    // A-Z expand to 10-35 before being folded in
    const expanded = char >= "A" && char <= "Z"
      ? String(char.charCodeAt(0) - 55)
      : char;

    for (const digit of expanded) {
      remainder = (remainder * 10 + Number(digit)) % 97;
    }
  }

  return remainder;
}

export function isValidIban(value) {
  const iban = normalizeIban(value);
  return PK_IBAN.test(iban) && mod97(iban) === 1;
}

/** Bank code sits at positions 4-8, e.g. UNIL for UBL. */
export function bankCode(value) {
  const iban = normalizeIban(value);
  return PK_IBAN.test(iban) ? iban.slice(4, 8) : "";
}
