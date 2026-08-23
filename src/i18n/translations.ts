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
    "sidebar.tutorial": "TUTORIAL",
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
    "sidebar.more": "More",
    "sidebar.mobileNavLabel": "Main navigation",
    "sidebar.closeMenu": "Close menu",

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

    // Settings / Environment
    "settings.environmentTitle": "Environment",
    "settings.manualAdvanceLabel": "Manual verse advance",
    "settings.manualAdvanceDescription":
      "Don't auto-clear to the next verse. Press Space or Enter once a verse is fully correct to move on.",
    "settings.wordProcessorModeLabel": "Word processor mode",
    "settings.wordProcessorModeDescription":
      "Click a character to move the cursor there, and use arrow keys to navigate and fix mistakes mid-verse.",

    // Settings / Sound
    "settings.soundTitle": "Sound",
    "settings.soundEnabledLabel": "Sounds",
    "settings.soundEnabledDescription": "Turn all sound effects on or off.",
    "settings.errorSoundLabel": "Error sound",
    "settings.completionSoundLabel": "Completion sound",
    "settings.soundPreview": "Preview",

    "palette.text": "Accent",
    "palette.correct": "Correct",
    "palette.incorrect": "Error",
    "palette.untyped": "Untyped",
    "palette.category.essentials": "The Essentials",
    "palette.category.cafe": "Café & Confections",
    "palette.category.nature": "Nature & Elements",
    "palette.category.dreamscape": "Dreamscape & Synth",

    // Landing
    "landing.subtitle": "Life, together with the Word~~~!",
    "landing.loginRemind": "Make sure to sign in before you start if you want to save your progress to the cloud.",
    "landing.welcomeBack": "Welcome back, {name}.",
    "landing.welcomeBackSubtitle": "Pick a book below whenever you're ready to keep going.",
    "landing.signUpCta": "Sign up free",
    "landing.signInCta": "Sign in",
    "landing.goToProfile": "Go to your profile",
    "landing.viewLeaderboard": "See the leaderboard",
    "landing.customizeNote": "Themes, fonts, and text size are all yours to customize — find them in Settings.",

    // Tutorial
    "tutorial.title": "How to Use LivingWords",
    "tutorial.intro":
      "A quick tour of what's here and how to get the most out of it.",
    "tutorial.typing.title": "Typing Mode",
    "tutorial.typing.body":
      "Type out Bible verses word for word as they're shown on screen — this is the default mode. Finishing a chapter records your words-per-minute (or characters-per-minute for Korean), your accuracy, and bumps your daily streak. Turn on Word Processor Mode or Manual Verse Advance in Settings if you'd like the typing experience to feel more like a text editor.",
    "tutorial.reading.title": "Reading Mode",
    "tutorial.reading.body":
      "Prefer to just read? Switch to Reading Mode from the sidebar (or the mode toggle on mobile) to browse chapters without typing anything. Your reading position is saved separately from your typing progress, so you can pick either mode back up where you left off.",
    "tutorial.progress.title": "Progress & Your Profile",
    "tutorial.progress.body":
      "Your profile keeps track of chapters completed, your best and average speeds, your current and longest streaks, and any badges you've earned. Sign up (or sign in with Google) to save this across devices — as a guest, progress only lives in that browser.",
    "tutorial.bookmarks.title": "Bookmarking Verses",
    "tutorial.bookmarks.body":
      "Tap or click a verse while typing or reading to bookmark it. Saved verses show up on your profile, and you can choose to feature a few of them on your public profile for others to see.",
    "tutorial.leaderboard.title": "Leaderboard",
    "tutorial.leaderboard.body":
      "See how you stack up against other users on streaks, accuracy, chapters completed, total completions, fastest typing speed, and full Bible read-throughs — individually or by team. Set a public username in your profile settings to appear on it.",
    "tutorial.livworders.title": "LivWorders Directory & Teams",
    "tutorial.livworders.body":
      "Browse other users' public profiles, or create and join teams to combine your progress with friends on the team leaderboards.",
    "tutorial.settings.title": "Settings",
    "tutorial.settings.body":
      "Customize your color theme, font, and text size, adjust environment options like manual verse advance and word processor mode, and control sound effects — all synced to your account.",
    "tutorial.account.title": "Your Account",
    "tutorial.account.body":
      "Sign up with an email and password or continue with Google. Forgot your password? Use the \"Forgot password?\" link on the sign-in page. Already have an email/password account? You can link Google to it from the Account tab on your profile.",

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
    "auth.forgotPassword": "Forgot password?",
    "auth.forgotPasswordTitle": "Reset your password",
    "auth.forgotPasswordIntro": "Enter the email you signed up with and we'll send you a link to reset your password.",
    "auth.sendResetLink": "Send reset link",
    "auth.resetLinkSent": "If an account exists for {email}, we've sent a password reset link to it. Check your inbox.",
    "auth.backToSignIn": "Back to sign in",
    "auth.resetPasswordTitle": "Choose a new password",
    "auth.resetPasswordIntro": "Enter a new password for your account.",
    "auth.newPassword": "New password",
    "auth.resetPasswordSubmit": "Reset password",
    "auth.resetPasswordSuccess": "Your password has been reset. You can now sign in with your new password.",
    "auth.resetPasswordInvalidToken": "This reset link is invalid or has expired. Please request a new one.",

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
    "leaderboard.board.accuracy.label": "Accuracy",
    "leaderboard.board.accuracy.blurb": "Highest average accuracy across completed chapters.",
    "leaderboard.board.accuracy.valueHeader": "Avg accuracy",
    "leaderboard.board.accuracy.empty": "No completions yet — be the first!",
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
    "teams.ownerLeaveHint": "You're the owner — transfer ownership or delete the team below to leave.",
    "teams.settingsTitle": "Team settings",
    "teams.saving": "Saving…",
    "teams.saveChanges": "Save changes",
    "teams.settingsSaveError": "Couldn't save those changes.",
    "teams.transferTitle": "Transfer ownership",
    "teams.transferHint": "Hand this team over to another member. You'll stay a member, just no longer the owner.",
    "teams.transferNoMembersHint": "There's nobody else on this team to transfer ownership to.",
    "teams.transferButton": "Transfer…",
    "teams.transferConfirm": "Confirm transfer",
    "teams.transferring": "Transferring…",
    "teams.transferError": "Couldn't transfer ownership.",
    "teams.deleteTitle": "Delete team",
    "teams.deleteHint": "Permanently deletes this team. Members fall back to Solo.",
    "teams.deleteButton": "Delete team…",
    "teams.deleteConfirm": "Confirm delete",
    "teams.deleting": "Deleting…",
    "teams.deleteError": "Couldn't delete this team.",

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

    // Profile - tabs
    "profile.tabOverview": "Overview",
    "profile.tabProgress": "Progress",
    "profile.tabPublic": "Public",
    "profile.tabVerses": "Verses",
    "profile.tabAccount": "Account",

    // Profile - Account tab
    "profile.accountSignInMethods": "Sign-in methods",
    "profile.accountGoogleLinked": "Your Google account is linked. You can sign in with either your password or Google.",
    "profile.accountGoogleNotLinked": "Link your Google account to sign in faster next time.",
    "profile.accountLinkGoogle": "Link Google Account",
    "profile.accountLinkGoogleError": "Couldn't link your Google account. Please try again.",
    "profile.accountLoading": "Checking your linked accounts…",

    // ProgressGrid
    "progress.translation": "Translation",

    // Profile - Bookmarked verses section
    "profile.bookmarkedVerses": "Bookmarked verses",
    "profile.noBookmarks": "Click or long-press a verse while reading to bookmark it — it'll show up here.",
    "profile.bookmarkTranslation": "Translation",
    "profile.bookmarkDate": "Bookmarked",
    "profile.featureToggleLabel": "Show on public profile",
    "profile.featuredCount": "{count}/{max} featured",
    "profile.featuredLimitReached": "You can feature up to {max} verses — turn one off to add another.",
    "profile.removeBookmark": "Remove",
    "profile.bookmarkUpdateError": "Couldn't update that bookmark.",

    // BookmarkPrompt
    "bookmarkPrompt.addQuestion": "Bookmark verse {verse}?",
    "bookmarkPrompt.removeQuestion": "Remove bookmark from verse {verse}?",
    "bookmarkPrompt.cancel": "Cancel",
    "bookmarkPrompt.add": "Bookmark",
    "bookmarkPrompt.remove": "Remove",

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
    "publicProfile.featuredVerses": "Featured verses",

    // ReadPage
    "read.loadErrorPrefix": "Couldn't load this chapter.",
    "read.record": "Your record for this chapter",
    "read.recordTimesCompleted": "Times completed",
    "read.recordBestSpeed": "Best speed",
    "read.recordAvgSpeed": "Avg speed",
    "read.recordAvgAccuracy": "Avg accuracy",

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
    "sidebar.tutorial": "안내서",
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
    "sidebar.more": "더보기",
    "sidebar.mobileNavLabel": "메인 내비게이션",
    "sidebar.closeMenu": "메뉴 닫기",

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

    // Settings / Environment
    "settings.environmentTitle": "환경설정",
    "settings.manualAdvanceLabel": "수동으로 다음 절 넘기기",
    "settings.manualAdvanceDescription":
      "완료된 절이 자동으로 다음 절로 넘어가지 않습니다. 오류 없이 다 입력한 후 스페이스나 엔터를 눌러 직접 넘기세요.",
    "settings.wordProcessorModeLabel": "워드프로세서 모드",
    "settings.wordProcessorModeDescription":
      "글자를 클릭하면 그 위치로 커서가 이동하고, 방향키로 절 안을 이동하며 오타를 고칠 수 있습니다.",

    // Settings / Sound
    "settings.soundTitle": "소리",
    "settings.soundEnabledLabel": "소리",
    "settings.soundEnabledDescription": "모든 효과음을 켜거나 끕니다.",
    "settings.errorSoundLabel": "오류 효과음",
    "settings.completionSoundLabel": "완료 효과음",
    "settings.soundPreview": "미리듣기",

    "palette.text": "강조",
    "palette.correct": "정확",
    "palette.incorrect": "오류",
    "palette.untyped": "미입력",
    "palette.category.essentials": "에센셜",
    "palette.category.cafe": "카페 & 디저트",
    "palette.category.nature": "자연 & 자연물",
    "palette.category.dreamscape": "드림스케이프 & 신스",

    // Landing
    "landing.subtitle": "말씀과 함께하는 삶~~~!",
    "landing.loginRemind": "회원가입하시면 기록을 저장하실 수 있습니다.",
    "landing.welcomeBack": "{name}님, 환영합니다.",
    "landing.welcomeBackSubtitle": "준비되시면 아래에서 책을 골라 이어서 시작하세요.",
    "landing.signUpCta": "무료로 회원가입",
    "landing.signInCta": "로그인",
    "landing.goToProfile": "내 프로필로 이동",
    "landing.viewLeaderboard": "리더보드 보기",
    "landing.customizeNote": "설정에서 테마와 글꼴 및 글자 크기를 마음대로 변경하실 수 있습니다.",

    // Tutorial
    "tutorial.title": "안내서",
    "tutorial.intro": "사이트에서 무엇을 할 수 있는지, 어떻게 시작하면 좋을지 간단히 안내해 드립니다.",
    "tutorial.typing.title": "타이핑 모드",
    "tutorial.typing.body":
      "화면에 표시되는 성경 구절을 그대로 따라 입력합니다 — 기본 모드입니다. 한 장을 완료하면 분당 타수(영어는 WPM, 한글은 타/분)와 정확도가 기록되고, 연속 학습일이 올라갑니다. 문서 편집기처럼 사용하고 싶다면 설정에서 워드 프로세서 모드나 수동 구절 넘김 기능을 켜보세요.",
    "tutorial.reading.title": "읽기 모드",
    "tutorial.reading.body":
      "그냥 읽고 싶으신가요? 사이드바(모바일에서는 모드 전환 버튼)에서 읽기 모드로 전환하면 입력 없이 장을 넘겨보실 수 있습니다. 읽기 위치는 타이핑 진행 상황과 별도로 저장되므로 두 모드 모두 이어서 시작하실 수 있습니다.",
    "tutorial.progress.title": "진행 상황 & 프로필",
    "tutorial.progress.body":
      "프로필에서는 완료한 장 수, 평균/최고 속도, 현재 및 최장 연속 기록, 획득한 배지를 확인하실 수 있습니다. 회원가입(또는 Google 로그인)을 하시면 여러 기기에서 기록이 저장됩니다 — 게스트로 이용하시면 진행 상황은 해당 브라우저에만 남습니다.",
    "tutorial.bookmarks.title": "구절 저장하기",
    "tutorial.bookmarks.body":
      "타이핑 또는 읽기 중 구절을 탭하거나 클릭하면 저장하실 수 있습니다. 저장한 구절은 프로필에서 확인할 수 있고, 원하시면 일부를 공개 프로필에 표시할 수도 있습니다.",
    "tutorial.leaderboard.title": "리더보드",
    "tutorial.leaderboard.body":
      "연속 기록, 정확도, 완료한 장 수, 총 완료 횟수, 최고 타이핑 속도, 성경 완독 횟수 기준으로 개인 또는 팀 순위를 확인하실 수 있습니다. 프로필 설정에서 공개 사용자 이름을 설정하면 리더보드에 표시됩니다.",
    "tutorial.livworders.title": "살말꾼 디렉토리 & 팀",
    "tutorial.livworders.body": "다른 사용자의 공개 프로필을 둘러보거나, 팀을 만들거나 가입해서 친구들과 팀 리더보드에서 함께할 수 있습니다.",
    "tutorial.settings.title": "설정",
    "tutorial.settings.body":
      "색상 테마, 글꼴, 글자 크기를 원하는 대로 바꾸고, 수동 구절 넘김이나 워드 프로세서 모드 같은 환경 설정을 조정하고, 효과음도 관리하실 수 있습니다 — 모두 계정에 저장됩니다.",
    "tutorial.account.title": "계정",
    "tutorial.account.body":
      "이메일과 비밀번호로 가입하거나 Google로 계속하실 수 있습니다. 비밀번호를 잊으셨다면 로그인 페이지의 '비밀번호를 잊으셨나요?' 링크를 이용해 주세요. 이미 이메일/비밀번호 계정이 있으시다면 프로필의 계정 탭에서 Google 계정을 연결하실 수 있습니다.",

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
    "auth.forgotPassword": "비밀번호를 잊으셨나요?",
    "auth.forgotPasswordTitle": "비밀번호 재설정",
    "auth.forgotPasswordIntro": "가입 시 사용하신 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.",
    "auth.sendResetLink": "재설정 링크 보내기",
    "auth.resetLinkSent": "{email} 주소로 계정이 존재하는 경우 비밀번호 재설정 링크를 보내드렸습니다. 받은편지함을 확인해 주세요.",
    "auth.backToSignIn": "로그인으로 돌아가기",
    "auth.resetPasswordTitle": "새 비밀번호 설정",
    "auth.resetPasswordIntro": "계정에 사용할 새 비밀번호를 입력해 주세요.",
    "auth.newPassword": "새 비밀번호",
    "auth.resetPasswordSubmit": "비밀번호 재설정",
    "auth.resetPasswordSuccess": "비밀번호가 재설정되었습니다. 이제 새 비밀번호로 로그인하실 수 있습니다.",
    "auth.resetPasswordInvalidToken": "이 재설정 링크는 유효하지 않거나 만료되었습니다. 새 링크를 요청해 주세요.",

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
    "leaderboard.board.accuracy.label": "정확도",
    "leaderboard.board.accuracy.blurb": "완료한 챕터 기준 평균 정확도가 가장 높은 사람.",
    "leaderboard.board.accuracy.valueHeader": "평균 정확도",
    "leaderboard.board.accuracy.empty": "아직 완료 기록이 없습니다 — 첫 번째가 되어보세요!",
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
    "teams.ownerLeaveHint": "팀장입니다 — 탈퇴하려면 아래에서 소유권을 넘기거나 팀을 삭제하세요.",
    "teams.settingsTitle": "팀 설정",
    "teams.saving": "저장 중…",
    "teams.saveChanges": "변경 사항 저장",
    "teams.settingsSaveError": "변경 사항을 저장할 수 없습니다.",
    "teams.transferTitle": "소유권 이전",
    "teams.transferHint": "다른 팀원에게 팀을 넘길 수 있습니다. 이전 후에도 팀원으로 남습니다.",
    "teams.transferNoMembersHint": "소유권을 넘길 다른 팀원이 없습니다.",
    "teams.transferButton": "이전…",
    "teams.transferConfirm": "이전 확인",
    "teams.transferring": "이전 중…",
    "teams.transferError": "소유권을 이전할 수 없습니다.",
    "teams.deleteTitle": "팀 삭제",
    "teams.deleteHint": "이 팀을 영구적으로 삭제합니다. 팀원들은 개인(Solo) 상태로 돌아갑니다.",
    "teams.deleteButton": "팀 삭제…",
    "teams.deleteConfirm": "삭제 확인",
    "teams.deleting": "삭제 중…",
    "teams.deleteError": "팀을 삭제할 수 없습니다.",

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

    // Profile - tabs
    "profile.tabOverview": "개요",
    "profile.tabProgress": "진행 상황",
    "profile.tabPublic": "공개 프로필",
    "profile.tabVerses": "구절",
    "profile.tabAccount": "계정",

    // Profile - Account tab
    "profile.accountSignInMethods": "로그인 방법",
    "profile.accountGoogleLinked": "Google 계정이 연결되어 있습니다. 비밀번호 또는 Google로 로그인하실 수 있습니다.",
    "profile.accountGoogleNotLinked": "Google 계정을 연결하면 다음에 더 빠르게 로그인하실 수 있습니다.",
    "profile.accountLinkGoogle": "Google 계정 연결",
    "profile.accountLinkGoogleError": "Google 계정을 연결하지 못했습니다. 다시 시도해 주세요.",
    "profile.accountLoading": "연결된 계정을 확인하는 중…",

    // ProgressGrid
    "progress.translation": "번역본",

    // Profile - Bookmarked verses section
    "profile.bookmarkedVerses": "북마크한 구절",
    "profile.noBookmarks": "읽는 중에 구절을 클릭하거나 길게 누르면 북마크할 수 있어요 — 여기에 표시됩니다.",
    "profile.bookmarkTranslation": "번역본",
    "profile.bookmarkDate": "북마크한 날짜",
    "profile.featureToggleLabel": "공개 프로필에 표시",
    "profile.featuredCount": "{count}/{max}개 표시 중",
    "profile.featuredLimitReached": "최대 {max}개까지 표시할 수 있어요 — 다른 구절을 추가하려면 하나를 꺼주세요.",
    "profile.removeBookmark": "삭제",
    "profile.bookmarkUpdateError": "북마크를 업데이트하지 못했습니다.",

    // BookmarkPrompt
    "bookmarkPrompt.addQuestion": "{verse}절을 북마크할까요?",
    "bookmarkPrompt.removeQuestion": "{verse}절 북마크를 삭제할까요?",
    "bookmarkPrompt.cancel": "취소",
    "bookmarkPrompt.add": "북마크",
    "bookmarkPrompt.remove": "삭제",

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
    "publicProfile.featuredVerses": "대표 구절",

    // ReadPage
    "read.loadErrorPrefix": "이 챕터를 불러올 수 없습니다.",
    "read.record": "이 챕터의 기록",
    "read.recordTimesCompleted": "완료 횟수",
    "read.recordBestSpeed": "최고 속도",
    "read.recordAvgSpeed": "평균 속도",
    "read.recordAvgAccuracy": "평균 정확도",

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
