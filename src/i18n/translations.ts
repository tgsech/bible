export type Lang = "en" | "ko";

// Flat key -> string dictionary for each supported UI language. Keep keys
// grouped by page/component (matching filenames) so it's easy to find the
// right entry when a component's copy changes. `t()` in LanguageContext
// does simple `{token}` interpolation against the `vars` passed in.
export const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  en: {
    // Sidebar
    "sidebar.profile": "PROFILE",
    "sidebar.home": "HOME",
    "sidebar.leaderboard": "LEADERBOARD",
    "sidebar.livworders": "LIVWORDERS",
    "sidebar.typeEngine": "BIBLE",
    "sidebar.memTool": "MEM TOOL",
    "sidebar.about": "ABOUT",
    "sidebar.settings": "SETTINGS",
    "sidebar.brand": "LIVINGWORDS",
    "sidebar.reading": "READING MODE",
    "sidebar.typing": "TYPING MODE",
    "sidebar.signOut": "Sign out",
    "sidebar.expand": "Expand sidebar",
    "sidebar.collapse": "Collapse sidebar",
    "sidebar.langEnglish": "EN",
    "sidebar.langKorean": "한글",
    "sidebar.langToggleLabel": "Language",

    // Common
    "common.loading": "Loading…",
    "common.backHome": "← Back home",
    "common.home": "← Home",
    "common.signIn": "Sign in",
    "common.save": "Save",
    "common.saving": "Saving…",
    "common.saved": "Saved!",

    // Settings / Theme
    "settings.title": "Settings",
    "settings.intro": "Pick a color set, font, and text size. All follow your account across devices.",
    "settings.themesTitle": "Themes",
    "settings.colorSets": "Color Sets",
    "settings.font": "Font",
    "settings.textSize": "Text Size",
    "settings.sample": "Sample Text",
    "palette.text": "Text",
    "palette.correct": "Correct",
    "palette.incorrect": "Error",
    "palette.untyped": "Untyped",

    // Landing
    "landing.subtitle": "Life, together with the Word~~~!",
    "landing.loginRemind": "Make sure to sign in before you start if you want to save your progress to the cloud.",

    // About
    "about.title": "About",
    "about.intro":
      "This is a Bible Typing Game developed with love from the Toronto Good Shepherd Evangelical Church (TGSECH).",
    "about.licensing": "(Express Licensing via YouVersion API)",

    // Auth
    "auth.brand": "LivingWords",
    "auth.signInTab": "Sign In",
    "auth.signUpTab": "Sign Up",
    "auth.alreadySignedIn": "You're already signed in as {name}.",
    "auth.name": "Name",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.pleaseWait": "Please wait…",
    "auth.createAccount": "Create account",
    "auth.or": "or",
    "auth.continueGoogle": "Continue with Google",
    "auth.genericError": "Something went wrong. Please try again.",

    // Leaderboard
    "leaderboard.title": "Leaderboard",
    "leaderboard.introPre":
      "Ranked by public username where set, otherwise by sign-up name. Want to show up under a different name? Set a username from your",
    "leaderboard.introLink": "profile settings",
    "leaderboard.loadErrorPrefix": "Couldn't load the leaderboard.",
    "leaderboard.nameCol": "Name",
    "leaderboard.board.streak.label": "Streak",
    "leaderboard.board.streak.blurb": "Consecutive days active, longest run first as a tiebreaker.",
    "leaderboard.board.streak.valueHeader": "Current streak",
    "leaderboard.board.streak.empty": "Nobody has an active streak yet — finish a chapter today to start one.",
    "leaderboard.board.chapters.label": "Chapters Completed",
    "leaderboard.board.chapters.blurb": "Most distinct chapters finished at least once.",
    "leaderboard.board.chapters.valueHeader": "Chapters",
    "leaderboard.board.chapters.empty": "No completed chapters yet — be the first!",
    "leaderboard.board.repeats.label": "Most Completions",
    "leaderboard.board.repeats.blurb": "Total run-throughs across every chapter, repeats included.",
    "leaderboard.board.repeats.valueHeader": "Completions",
    "leaderboard.board.repeats.empty": "No completions yet — be the first!",
    "leaderboard.board.bible.label": "Full Bible Read-Throughs",
    "leaderboard.board.bible.blurb": "Users who've completed every chapter of a translation, most times.",
    "leaderboard.board.bible.valueHeader": "Read-throughs",
    "leaderboard.board.bible.empty": "Nobody has finished a full translation yet.",
    "leaderboard.board.wpm.label": "Fastest (WPM)",
    "leaderboard.board.wpm.blurb": "Highest average words-per-minute across completed chapters.",
    "leaderboard.board.wpm.valueHeader": "Avg WPM",
    "leaderboard.board.wpm.empty": "No WPM completions yet.",
    "leaderboard.board.cpm.label": "Fastest (타/분)",
    "leaderboard.board.cpm.blurb": "Highest average keystrokes-per-minute across completed chapters.",
    "leaderboard.board.cpm.valueHeader": "Avg 타/분",
    "leaderboard.board.cpm.empty": "No 타/분 completions yet.",

    // LivWorders
    "livworders.title": "LivWorders",
    "livworders.body": "A directory for looking up other users and public profiles is coming soon.",
    "livworders.tabs.users": "Users",
    "livworders.tabs.teams": "Teams",

    // Directory (Users tab)
    "directory.loadErrorPrefix": "Couldn't load the directory.",
    "directory.empty": "Nobody's set a public username yet — be the first!",
    "directory.teamLabel": "Team:",
    "directory.solo": "Solo",

    // Teams (Teams tab, team cards, team detail page)
    "teams.loadErrorPrefix": "Couldn't load the teams.",
    "teams.empty": "No teams yet — start one!",
    "teams.createButton": "+ Create a team",
    "teams.createTitle": "Create a team",
    "teams.nameLabel": "Team name",
    "teams.namePlaceholder": "2-40 characters",
    "teams.policyLabel": "Who can join?",
    "teams.policyAuto": "Anyone can join instantly",
    "teams.policyRequest": "Requires my approval",
    "teams.createSubmit": "Create team",
    "teams.creating": "Creating…",
    "teams.cancel": "Cancel",
    "teams.createError": "Couldn't create that team.",
    "teams.join": "Join",
    "teams.requestToJoin": "Request to join",
    "teams.leave": "Leave",
    "teams.cancelRequest": "Cancel request",
    "teams.pending": "Pending",
    "teams.signInToJoin": "Sign in to join",
    "teams.backTeams": "← Teams",
    "teams.notFoundTitle": "No team here",
    "teams.notFoundBody": "That team doesn't exist, or has been removed.",
    "teams.loadErrorDetailPrefix": "Couldn't load this team.",
    "teams.ownerBadge": "Owner",
    "teams.policyAutoBadge": "Auto-join",
    "teams.policyRequestBadge": "Request to join",
    "teams.membersTitle": "Members",
    "teams.noMembers": "Nobody's joined this team yet.",
    "teams.pendingRequestsTitle": "Pending requests",
    "teams.noPendingRequests": "No pending requests.",
    "teams.approve": "Approve",
    "teams.reject": "Reject",
    "teams.actionErrorPrefix": "Something went wrong.",

    // Leaderboard scope toggle (users vs teams)
    "leaderboard.scope.users": "Users",
    "leaderboard.scope.teams": "Teams",
    "leaderboard.teamNameCol": "Team",
    "leaderboard.teamMembersCol": "Members",
    "leaderboard.teamsEmpty": "No teams have any activity on this board yet.",

    // Memory tool
    "memory.title": "Memory Tool",
    "memory.body": "Feature coming soon!",

    // Profile
    "profile.title": "Profile",
    "profile.signInPrompt": "Sign in to see your saved progress, stats, and completions here.",
    "profile.loadErrorPrefix": "Couldn't load your profile.",
    "profile.possessiveTitle": "{name}'s Profile",
    "profile.currentlyTyping": "Currently typing",
    "profile.currentlyReading": "Currently reading",
    "profile.noSavedPosition": "No saved position yet — start typing a chapter to see it here.",
    "profile.noSavedReadingPosition":
      "No saved reading position yet — switch to read-only mode on a chapter to see it here.",
    "profile.verse": "verse",
    "profile.overallStats": "Overall stats",
    "profile.totalCompletions": "Total completions",
    "profile.chaptersFinished": "Chapters finished",
    "profile.avgWpm": "Avg WPM",
    "profile.avgCpm": "Avg CPM",
    "profile.avgAccuracy": "Avg accuracy",
    "profile.completedChapters": "Completed chapters",
    "profile.noCompletions": "Finish a chapter and it'll show up here.",
    "profile.chapterCol": "Chapter",
    "profile.timesCompletedCol": "Times completed",
    "profile.bestSpeedCol": "Best speed",
    "profile.avgAccuracyCol": "Avg accuracy",
    "profile.profileSettings": "Profile settings",
    "profile.settingsHint":
      "Your username shows on the leaderboard and directory instead of your account name — leave it blank to just show as anonymous there.",
    "profile.viewPublic": "View your public profile →",

    // ProfileSettingsForm
    "form.username": "Username",
    "form.usernamePlaceholder": "Shown on the leaderboard and directory instead of your name",
    "form.aboutMe": "About me",
    "form.aboutMePlaceholder": "A short bio for your public card",
    "form.moodLabel": "Current mood",
    "form.moodPlaceholder": "e.g. Slowly making it through Psalms 🌱",
    "form.error": "Something went wrong saving that.",

    // PublicProfile
    "publicProfile.backLeaderboard": "← Leaderboard",
    "publicProfile.notFoundTitle": "No profile here",
    "publicProfile.notFoundBody": 'Nobody\'s claimed the username "{username}", or they haven\'t set one publicly.',
    "publicProfile.loadErrorPrefix": "Couldn't load this profile.",
    "publicProfile.aboutMe": "About Me:",
    "publicProfile.mood": "Mood:",
    "publicProfile.signedUpAs": "Signed up as {name}",
    "publicProfile.since": "Since {date}",
    "publicProfile.stats": "Stats",
    "publicProfile.currentStreak": "Current streak",
    "publicProfile.longestStreak": "Longest streak",
    "publicProfile.badges": "Badges",
    "publicProfile.noBadges": "No badges earned yet.",

    // ReadPage
    "read.loadErrorPrefix": "Couldn't load this chapter.",

    // BookChapterSelector
    "selector.translation": "Translation",
    "selector.book": "Book",
    "selector.chapter": "Chapter",

    // ChapterNav
    "nav.prev": "◀ Previous Chapter",
    "nav.next": "Next Chapter ▶",

    // LiveStats
    "livestats.acc": "acc",

    // CompletionModal
    "completion.accuracy": "Accuracy",
  },
  ko: {
    // Sidebar
    "sidebar.profile": "프로필",
    "sidebar.home": "홈",
    "sidebar.leaderboard": "리더보드",
    "sidebar.livworders": "살말꾼",
    "sidebar.typeEngine": "성경",
    "sidebar.memTool": "암기 도구",
    "sidebar.about": "소개",
    "sidebar.settings": "설정",
    "sidebar.brand": "살아있는 말씀",
    "sidebar.reading": "읽기 모드",
    "sidebar.typing": "타이핑 모드",
    "sidebar.signOut": "로그아웃",
    "sidebar.expand": "사이드바 펼치기",
    "sidebar.collapse": "사이드바 접기",
    "sidebar.langEnglish": "EN",
    "sidebar.langKorean": "한글",
    "sidebar.langToggleLabel": "언어",

    // Common
    "common.loading": "불러오는 중…",
    "common.backHome": "← 홈으로",
    "common.home": "← 홈",
    "common.signIn": "로그인",
    "common.save": "저장",
    "common.saving": "저장 중…",
    "common.saved": "저장했습니다!",

    // Settings / Theme
    "settings.title": "설정",
    "settings.intro": "색상 세트, 폰트, 글자 크기를 선택하세요. 계정에 저장되어 모든 기기에서 동일하게 적용됩니다.",
    "settings.themesTitle": "테마",
    "settings.colorSets": "색상 세트",
    "settings.font": "폰트",
    "settings.textSize": "글자 크기",
    "settings.sample": "샘플",
    "palette.text": "텍스트",
    "palette.correct": "정확",
    "palette.incorrect": "오류",
    "palette.untyped": "미입력",

    // Landing
    "landing.subtitle": "말씀과 함께하는 삶~~~!",
    "landing.loginRemind": "기록을 저장하고 싶으시면 꼭 회원가입하고 시작하시길 바랍니다.",

    // About
    "about.title": "소개",
    "about.intro": "이 사이트는 토론토 선한목자교회(TGSECH)에서 사랑으로 개발한 성경 타이핑 게임입니다.",
    "about.licensing": "(YouVersion API를 통한 익스프레스 라이선스)",

    // Auth
    "auth.brand": "살아있는 말씀",
    "auth.signInTab": "로그인",
    "auth.signUpTab": "회원가입",
    "auth.alreadySignedIn": "이미 {name}(으)로 로그인되어 있습니다.",
    "auth.name": "이름",
    "auth.email": "이메일",
    "auth.password": "비밀번호",
    "auth.pleaseWait": "잠시만 기다려주세요…",
    "auth.createAccount": "계정 만들기",
    "auth.or": "또는",
    "auth.continueGoogle": "Google로 계속하기",
    "auth.genericError": "문제가 발생했습니다. 다시 시도해주세요.",

    // Leaderboard
    "leaderboard.title": "리더보드",
    "leaderboard.introPre":
      "설정된 경우 공개 사용자 이름으로, 아니면 가입 시 이름으로 순위가 매겨집니다. 다른 이름으로 표시하고 싶으신가요?",
    "leaderboard.introLink": "프로필 설정",
    "leaderboard.loadErrorPrefix": "리더보드를 불러올 수 없습니다.",
    "leaderboard.nameCol": "이름",
    "leaderboard.board.streak.label": "연속 기록",
    "leaderboard.board.streak.blurb": "활동한 연속 일수, 동점일 경우 최장 기록이 우선입니다.",
    "leaderboard.board.streak.valueHeader": "현재 연속 기록",
    "leaderboard.board.streak.empty": "아직 활성화된 연속 기록이 없습니다 — 오늘 챕터를 완료해 시작해보세요.",
    "leaderboard.board.chapters.label": "완료한 챕터",
    "leaderboard.board.chapters.blurb": "적어도 한 번 완료한 서로 다른 챕터 수가 가장 많은 사람.",
    "leaderboard.board.chapters.valueHeader": "챕터 수",
    "leaderboard.board.chapters.empty": "아직 완료한 챕터가 없습니다 — 첫 번째가 되어보세요!",
    "leaderboard.board.repeats.label": "최다 완료",
    "leaderboard.board.repeats.blurb": "반복 포함, 모든 챕터를 통틀어 총 완료 횟수.",
    "leaderboard.board.repeats.valueHeader": "완료 횟수",
    "leaderboard.board.repeats.empty": "아직 완료 기록이 없습니다 — 첫 번째가 되어보세요!",
    "leaderboard.board.bible.label": "성경 완독",
    "leaderboard.board.bible.blurb": "번역본의 모든 챕터를 가장 많이 완료한 사용자.",
    "leaderboard.board.bible.valueHeader": "완독 횟수",
    "leaderboard.board.bible.empty": "아직 번역본을 완독한 사람이 없습니다.",
    "leaderboard.board.wpm.label": "최고 속도 (WPM)",
    "leaderboard.board.wpm.blurb": "완료한 챕터 기준 평균 분당 단어 수가 가장 높은 사람.",
    "leaderboard.board.wpm.valueHeader": "평균 WPM",
    "leaderboard.board.wpm.empty": "아직 WPM 완료 기록이 없습니다.",
    "leaderboard.board.cpm.label": "최고 속도 (타/분)",
    "leaderboard.board.cpm.blurb": "완료한 챕터 기준 평균 분당 타수가 가장 높은 사람.",
    "leaderboard.board.cpm.valueHeader": "평균 타/분",
    "leaderboard.board.cpm.empty": "아직 타/분 완료 기록이 없습니다.",

    // LivWorders
    "livworders.title": "살말꾼",
    "livworders.body": "다른 사용자와 공개 프로필을 찾아볼 수 있는 디렉토리가 곧 제공됩니다.",
    "livworders.tabs.users": "사용자",
    "livworders.tabs.teams": "팀",

    // Directory (Users tab)
    "directory.loadErrorPrefix": "디렉토리를 불러올 수 없습니다.",
    "directory.empty": "아직 공개 사용자 이름을 설정한 사람이 없습니다 — 첫 번째가 되어보세요!",
    "directory.teamLabel": "팀:",
    "directory.solo": "솔로",

    // Teams (Teams tab, team cards, team detail page)
    "teams.loadErrorPrefix": "팀 목록을 불러올 수 없습니다.",
    "teams.empty": "아직 팀이 없습니다 — 새로 만들어보세요!",
    "teams.createButton": "+ 팀 만들기",
    "teams.createTitle": "팀 만들기",
    "teams.nameLabel": "팀 이름",
    "teams.namePlaceholder": "2-40자",
    "teams.policyLabel": "누가 가입할 수 있나요?",
    "teams.policyAuto": "누구나 바로 가입 가능",
    "teams.policyRequest": "승인이 필요함",
    "teams.createSubmit": "팀 만들기",
    "teams.creating": "만드는 중…",
    "teams.cancel": "취소",
    "teams.createError": "팀을 만들 수 없습니다.",
    "teams.join": "가입",
    "teams.requestToJoin": "가입 요청",
    "teams.leave": "탈퇴",
    "teams.cancelRequest": "요청 취소",
    "teams.pending": "대기 중",
    "teams.signInToJoin": "가입하려면 로그인하세요",
    "teams.backTeams": "← 팀 목록",
    "teams.notFoundTitle": "팀을 찾을 수 없습니다",
    "teams.notFoundBody": "이 팀은 존재하지 않거나 삭제되었습니다.",
    "teams.loadErrorDetailPrefix": "이 팀을 불러올 수 없습니다.",
    "teams.ownerBadge": "팀장",
    "teams.policyAutoBadge": "자동 가입",
    "teams.policyRequestBadge": "가입 승인 필요",
    "teams.membersTitle": "팀원",
    "teams.noMembers": "아직 팀에 가입한 사람이 없습니다.",
    "teams.pendingRequestsTitle": "대기 중인 요청",
    "teams.noPendingRequests": "대기 중인 요청이 없습니다.",
    "teams.approve": "승인",
    "teams.reject": "거절",
    "teams.actionErrorPrefix": "문제가 발생했습니다.",

    // Leaderboard scope toggle (users vs teams)
    "leaderboard.scope.users": "사용자",
    "leaderboard.scope.teams": "팀",
    "leaderboard.teamNameCol": "팀",
    "leaderboard.teamMembersCol": "인원",
    "leaderboard.teamsEmpty": "아직 이 보드에서 활동한 팀이 없습니다.",

    // Memory tool
    "memory.title": "암기 도구",
    "memory.body": "기능이 곧 제공됩니다!",

    // Profile
    "profile.title": "프로필",
    "profile.signInPrompt": "로그인하면 저장된 진행 상황, 통계, 완료 기록을 여기서 확인할 수 있습니다.",
    "profile.loadErrorPrefix": "프로필을 불러올 수 없습니다.",
    "profile.possessiveTitle": "{name}님의 프로필",
    "profile.currentlyTyping": "현재 타이핑 중",
    "profile.currentlyReading": "현재 읽는 중",
    "profile.noSavedPosition": "아직 저장된 위치가 없습니다 — 챕터를 타이핑하면 여기에 표시됩니다.",
    "profile.noSavedReadingPosition":
      "아직 저장된 읽기 위치가 없습니다 — 챕터를 읽기 전용 모드로 전환하면 여기에 표시됩니다.",
    "profile.verse": "절",
    "profile.overallStats": "전체 통계",
    "profile.totalCompletions": "총 완료 수",
    "profile.chaptersFinished": "완료한 챕터",
    "profile.avgWpm": "평균 WPM",
    "profile.avgCpm": "평균 타/분",
    "profile.avgAccuracy": "평균 정확도",
    "profile.completedChapters": "완료한 챕터 목록",
    "profile.noCompletions": "챕터를 완료하면 여기에 표시됩니다.",
    "profile.chapterCol": "챕터",
    "profile.timesCompletedCol": "완료 횟수",
    "profile.bestSpeedCol": "최고 속도",
    "profile.avgAccuracyCol": "평균 정확도",
    "profile.profileSettings": "프로필 설정",
    "profile.settingsHint":
      "사용자 이름은 계정 이름 대신 리더보드와 디렉토리에 표시됩니다 — 비워두면 익명으로 표시됩니다.",
    "profile.viewPublic": "공개 프로필 보기 →",

    // ProfileSettingsForm
    "form.username": "사용자 이름",
    "form.usernamePlaceholder": "이름 대신 리더보드와 디렉토리에 표시됩니다",
    "form.aboutMe": "자기소개",
    "form.aboutMePlaceholder": "공개 카드에 표시될 짧은 소개",
    "form.moodLabel": "상태 메시지",
    "form.moodPlaceholder": "예: 시편을 천천히 읽어가는 중 🌱",
    "form.error": "저장 중 문제가 발생했습니다.",

    // PublicProfile
    "publicProfile.backLeaderboard": "← 리더보드",
    "publicProfile.notFoundTitle": "프로필이 없습니다",
    "publicProfile.notFoundBody": '"{username}" 사용자 이름을 가진 사람이 없거나, 공개로 설정하지 않았습니다.',
    "publicProfile.loadErrorPrefix": "이 프로필을 불러올 수 없습니다.",
    "publicProfile.aboutMe": "자기소개:",
    "publicProfile.mood": "상태 메시지:",
    "publicProfile.signedUpAs": "{name}(으)로 가입함",
    "publicProfile.since": "{date}부터 함께",
    "publicProfile.stats": "통계",
    "publicProfile.currentStreak": "현재 연속 기록",
    "publicProfile.longestStreak": "최장 연속 기록",
    "publicProfile.badges": "배지",
    "publicProfile.noBadges": "아직 획득한 배지가 없습니다.",

    // ReadPage
    "read.loadErrorPrefix": "이 챕터를 불러올 수 없습니다.",

    // BookChapterSelector
    "selector.translation": "번역본",
    "selector.book": "성경",
    "selector.chapter": "장",

    // ChapterNav
    "nav.prev": "◀ 이전 장",
    "nav.next": "다음 장 ▶",

    // LiveStats
    "livestats.acc": "정확도",

    // CompletionModal
    "completion.accuracy": "정확도",
  },
};
