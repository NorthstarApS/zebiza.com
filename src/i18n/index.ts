import da, { type Dictionary } from "./da";
import en from "./en";
import de from "./de";
import sv from "./sv";

export type LanguageCode = "da" | "en" | "de" | "sv";

export const SUPPORTED_LANGUAGES: LanguageCode[] = (
  (import.meta.env.VITE_SUPPORTED_LANGUAGES as string | undefined)?.split(",") as
    | LanguageCode[]
    | undefined
) ?? ["da", "en", "de", "sv"];

export const DEFAULT_LANGUAGE: LanguageCode =
  ((import.meta.env.VITE_DEFAULT_LANGUAGE as LanguageCode | undefined) ?? "da");

export const dictionaries: Record<LanguageCode, Dictionary> = { da, en, de, sv };

export const isLanguage = (value: string | undefined): value is LanguageCode =>
  !!value && (SUPPORTED_LANGUAGES as string[]).includes(value);

export type { Dictionary };
export { da, en, de, sv };
