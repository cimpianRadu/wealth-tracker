// Înainte ca textul extrasului să plece către modelul AI, ascundem ce nu e
// necesar pentru categorisire: IBAN-uri, numere de card, CNP-uri. Rămân
// ultimele 4 caractere, cât să se poată deosebi conturile între ele.

// Coada unui IBAN (sub 4 caractere) poate avea spațiu doar dacă e numerică, ca
// să nu înghită cuvântul de după (ex. „... 8401 CNP”).
const IBAN = /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){3,7}(?:[A-Z0-9]{1,3}|[ ]\d{1,3})?\b/g;
const CARD = /\b\d{4}[ -]?\d{2}[0-9*]{2}[ -]?[0-9*]{4}[ -]?\d{4}\b/g;
const CARD_STARRED = /\b\d{6}\*{6}\d{4}\b/g;
const CNP = /\b[1-8]\d{12}\b/g;

function keepLast4(match: string): string {
  const clean = match.replace(/[ -]/g, '');
  return `****${clean.slice(-4)}`;
}

export function maskStatementText(text: string): string {
  return text
    .replace(IBAN, keepLast4)
    .replace(CARD_STARRED, keepLast4)
    .replace(CARD, keepLast4)
    .replace(CNP, '[CNP]');
}
