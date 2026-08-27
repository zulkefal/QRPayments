import { isValidIban, normalizeIban, bankCode } from "./iban.js";
import { suggestBank } from "./banks.js";

/**
 * Everything a store has to tell us to start taking payments. Deliberately
 * two fields — every extra one is a merchant who does not finish setup.
 */
export function validateSettings({ iban, accountTitle, bankName } = {}) {
  const errors = {};
  const account = normalizeIban(iban);

  if (!account) {
    errors.iban = "Enter the IBAN money should be sent to.";
  } else if (!isValidIban(account)) {
    errors.iban = account.startsWith("PK")
      ? "That IBAN is not valid — check for a mistyped digit."
      : "Enter a Pakistani IBAN, starting with PK.";
  }

  const title = String(accountTitle || "").trim();
  if (!title) {
    // shoppers check the name on the transfer screen before confirming; a
    // mismatch with the store name reads as fraud and loses the order
    errors.accountTitle = "Enter the account title exactly as your bank shows it.";
  } else if (title.length > 100) {
    errors.accountTitle = "Account title is too long.";
  }

  const suggested = suggestBank(bankCode(account));
  const bank = String(bankName || "").trim() || suggested.name;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    settings: { iban: account, accountTitle: title, bankName: bank },
    suggestedBank: suggested,
  };
}
