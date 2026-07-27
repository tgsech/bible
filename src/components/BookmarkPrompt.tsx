import { useLanguage } from "../i18n/LanguageContext";
import "./BookmarkPrompt.css";

interface BookmarkPromptProps {
  verseNumber: number;
  // Whether this verse is already bookmarked - flips the prompt between
  // "bookmark this verse?" and "remove this bookmark?" (and the confirm
  // button's label/label), same tap gesture doing double duty as
  // add/remove per the product's single-gesture design.
  isBookmarked: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirm prompt shown on a verse click (desktop) / long-press (mobile),
 * see useLongPress.ts / VerseRow.tsx / ChapterView.tsx. Deliberately styled
 * as a small sibling of CompletionModal (same overlay + centered card +
 * pop-in animation) rather than introducing a new modal pattern. Uses only
 * `t()` (the UI language from LanguageContext) rather than a `language`
 * prop - unlike CompletionModal's hardcoded "Done!"/"수고했어요!", every
 * string here already has proper en/ko translation keys, so there's
 * nothing that needs the Bible text's own language.
 */
export function BookmarkPrompt({ verseNumber, isBookmarked, onConfirm, onCancel }: BookmarkPromptProps) {
  const { t } = useLanguage();

  return (
    <div
      className="bookmarkPromptOverlay"
      role="dialog"
      aria-modal="true"
      // Tapping the dimmed backdrop is a natural "never mind" - same
      // affordance most confirm dialogs give without needing an explicit
      // close (X) button cluttering this small a card.
      onClick={onCancel}
    >
      <div className="bookmarkPromptCard" onClick={(e) => e.stopPropagation()}>
        <p className="bookmarkPromptMessage">
          {isBookmarked
            ? t("bookmarkPrompt.removeQuestion", { verse: verseNumber })
            : t("bookmarkPrompt.addQuestion", { verse: verseNumber })}
        </p>
        <div className="bookmarkPromptActions">
          <button type="button" className="bookmarkPromptCancel" onClick={onCancel}>
            {t("bookmarkPrompt.cancel")}
          </button>
          <button type="button" className="bookmarkPromptConfirm" onClick={onConfirm}>
            {isBookmarked ? t("bookmarkPrompt.remove") : t("bookmarkPrompt.add")}
          </button>
        </div>
      </div>
    </div>
  );
}
