export interface SoundOption {
  id: string;
  label: string;
  url: string;
}

// Attribution (required by Pixabay's license):
// "Buzz" - Sound Effect by SoundShelfStudio from Pixabay
// https://pixabay.com/users/soundshelfstudio-46480698/

// "Clean" - Sound Effect by Vadim from Pixabay
// https://pixabay.com/users/vadim_makes_sound-54823268/

export const ERROR_SOUND_OPTIONS: SoundOption[] = [
  {
    id: "clean",
    label: "Clean",
    url: "https://cdn.pixabay.com/audio/2026/06/07/audio_ed97a94fa8.mp3",
  },
  {
    id: "buzz",
    label: "Buzz",
    url: "https://cdn.pixabay.com/audio/2026/05/08/audio_4291ec9b7b.mp3",
  },
  
];

// Attribution (required by Pixabay's license):
// "Hagyeongz" (김하경 완성 소리) - Sound Effect by Vicki Hamilton from Pixabay
// https://pixabay.com/users/flutie8211-17475707/
// "Chime" - Sound Effect by Universfield from Pixabay
// https://pixabay.com/users/universfield-28281460/
export const COMPLETION_SOUND_OPTIONS: SoundOption[] = [
  {
    id: "chime",
    label: "Chime",
    url: "https://cdn.pixabay.com/audio/2024/02/19/audio_e4043ea6be.mp3",
  },
  {
    id: "hagyeongz",
    label: "Hagyeongz",
    url: "https://cdn.pixabay.com/audio/2025/12/30/audio_f1f387e895.mp3",
  },
];

export function findSoundOption(options: SoundOption[], id: string | null): SoundOption | null {
  if (!id) return null;
  return options.find((option) => option.id === id) ?? null;
}

// A fresh Audio() per call rather than one shared/cached instance - lets a
// sound retrigger cleanly (e.g. two mistakes in quick succession) instead
// of cutting itself off mid-playback to restart from 0.
export function playSound(url: string) {
  try {
    const audio = new Audio(url);
    void audio.play().catch(() => {
      // Most likely autoplay being blocked because there hasn't been a
      // user gesture yet - nothing useful to surface for a sound effect.
    });
  } catch {
    // Audio() itself can throw in some locked-down environments - a sound
    // effect failing silently beats crashing the page over it.
  }
}
