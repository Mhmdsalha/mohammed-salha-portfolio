// next-intl 3: type every t("…") call against the English messages, so a missing or misspelt
// key fails `npm run typecheck` (P3-1). The message test keeps ar.json in step with en.json.
type Messages = typeof import("./messages/en.json");

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- next-intl's augmentation point
declare interface IntlMessages extends Messages {}
