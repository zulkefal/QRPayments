/**
 * Bank names by IBAN bank code, used to suggest a name during setup.
 *
 * This mapping is NOT authoritative — it was assembled from common usage, not
 * from a published register. A wrong bank name shown at checkout is worse than
 * none, because a shopper who thinks they are paying the wrong institution will
 * abandon the order. So `suggestBank` only ever produces a suggestion for a
 * merchant to confirm, and setup stores what the merchant confirmed.
 *
 * Add codes here only after seeing one on a real statement or bank app.
 * ABPA, MCIB, MPBL, NAYA, SADA and TMFB were confirmed against real account
 * numbers on 2026-08-27.
 */
const BANKS = {
  UNIL: "United Bank Limited (UBL)",
  HABB: "Habib Bank Limited (HBL)",
  MUCB: "MCB Bank",
  MEZN: "Meezan Bank",
  ALFH: "Bank Alfalah",
  BAHL: "Bank AL Habib",
  ASCM: "Askari Bank",
  FAYS: "Faysal Bank",
  NBPA: "National Bank of Pakistan",
  SCBL: "Standard Chartered Bank Pakistan",
  JSBL: "JS Bank",
  SONE: "Soneri Bank",
  BKIP: "BankIslami Pakistan",
  DUIB: "Dubai Islamic Bank Pakistan",
  ABPA: "Allied Bank",
  MCIB: "MCB Islamic Bank",
  MPBL: "Habib Metropolitan Bank",
  NAYA: "NayaPay",
  SADA: "SadaPay",
  TMFB: "Easypaisa (Telenor Microfinance Bank)",
};

/**
 * @returns {{name: string, code: string, confident: boolean}} `confident` is
 * false when the code is unrecognised — show the field blank and let the
 * merchant type it rather than guessing.
 */
export function suggestBank(bankCodeValue) {
  const code = String(bankCodeValue || "").toUpperCase();
  const name = BANKS[code];
  return { name: name || "", code, confident: Boolean(name) };
}

export function knownBankCodes() {
  return Object.keys(BANKS).sort();
}
