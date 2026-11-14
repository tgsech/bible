// The one passage the memory tool covers for now: the 2026 선한목자교회
// 전교인 성경 암송 대회 text (James 1:17-27). Only these eleven verses are
// bundled - the rest of 개역개정 is NOT on the site. `source` is the
// attribution line shown on the memory hub and the About page.

export type PassageLang = "ko" | "en";

export const VERSE_NUMBERS = [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27] as const;

/** Contest day, local time: Sunday, November 29, 2026. */
export const CONTEST_DATE = new Date(2026, 10, 29);

export interface Passage {
  book: string;
  chapter: number;
  reference: string;
  version: string;
  source: string;
  verses: Record<number, string>;
}

export const PASSAGE: Record<PassageLang, Passage> = {
  ko: {
    book: "야고보서",
    chapter: 1,
    reference: "야고보서 1:17–27",
    version: "개역개정",
    source: "성경전서 개역개정판 © 대한성서공회 (Korean Bible Society). 야고보서 1:17–27 인용.",
    verses: {
      17: "온갖 좋은 은사와 온전한 선물이 다 위로부터 빛들의 아버지께로부터 내려오나니 그는 변함도 없으시고 회전하는 그림자도 없으시니라",
      18: "그가 그 피조물 중에 우리로 한 첫 열매가 되게 하시려고 자기의 뜻을 따라 진리의 말씀으로 우리를 낳으셨느니라",
      19: "내 사랑하는 형제들아 너희가 알지니 사람마다 듣기는 속히 하고 말하기는 더디 하며 성내기도 더디 하라",
      20: "사람이 성내는 것이 하나님의 의를 이루지 못함이라",
      21: "그러므로 모든 더러운 것과 넘치는 악을 내버리고 너희 영혼을 능히 구원할 바 마음에 심어진 말씀을 온유함으로 받으라",
      22: "너희는 말씀을 행하는 자가 되고 듣기만 하여 자신을 속이는 자가 되지 말라",
      23: "누구든지 말씀을 듣고 행하지 아니하면 그는 거울로 자기의 생긴 얼굴을 보는 사람과 같아서",
      24: "제 자신을 보고 가서 그 모습이 어떠했는지를 곧 잊어버리거니와",
      25: "자유롭게 하는 온전한 율법을 들여다보고 있는 자는 듣고 잊어버리는 자가 아니요 실천하는 자니 이 사람은 그 행하는 일에 복을 받으리라",
      26: "누구든지 스스로 경건하다 생각하며 자기 혀를 재갈 물리지 아니하고 자기 마음을 속이면 이 사람의 경건은 헛것이라",
      27: "하나님 아버지 앞에서 정결하고 더러움이 없는 경건은 곧 고아와 과부를 그 환난중에 돌보고 또 자기를 지켜 세속에 물들지 아니하는 그것이니라",
    },
  },
  en: {
    book: "James",
    chapter: 1,
    reference: "James 1:17–27",
    version: "NIV",
    source:
      "Holy Bible, New International Version®, NIV® Copyright ©1973, 1978, 1984, 2011 by Biblica, Inc.® Used by permission. All rights reserved worldwide. James 1:17–27 quoted.",
    verses: {
      17: "Every good and perfect gift is from above, coming down from the Father of the heavenly lights, who does not change like shifting shadows.",
      18: "He chose to give us birth through the word of truth, that we might be a kind of firstfruits of all he created.",
      19: "My dear brothers and sisters, take note of this: Everyone should be quick to listen, slow to speak and slow to become angry,",
      20: "because human anger does not produce the righteousness that God desires.",
      21: "Therefore, get rid of all moral filth and the evil that is so prevalent and humbly accept the word planted in you, which can save you.",
      22: "Do not merely listen to the word, and so deceive yourselves. Do what it says.",
      23: "Anyone who listens to the word but does not do what it says is like someone who looks at his face in a mirror",
      24: "and, after looking at himself, goes away and immediately forgets what he looks like.",
      25: "But whoever looks intently into the perfect law that gives freedom, and continues in it—not forgetting what they have heard, but doing it—they will be blessed in what they do.",
      26: "Those who consider themselves religious and yet do not keep a tight rein on their tongues deceive themselves, and their religion is worthless.",
      27: "Religion that God our Father accepts as pure and faultless is this: to look after orphans and widows in their distress and to keep oneself from being polluted by the world.",
    },
  },
};

/** The verse after this one, wrapping from 27 back to 17. */
export function nextVerse(verse: number): number {
  const idx = VERSE_NUMBERS.indexOf(verse as (typeof VERSE_NUMBERS)[number]);
  return VERSE_NUMBERS[(idx + 1) % VERSE_NUMBERS.length];
}
