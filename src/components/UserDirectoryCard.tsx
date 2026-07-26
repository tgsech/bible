import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import "./UserDirectoryCard.css";

export interface DirectoryUser {
  username: string;
  name: string;
  bio: string | null;
  mood: string | null;
  teamName: string | null;
}

// Deliberately small and plain per the design brief: username, sign-up
// name, about me, mood, and team — nothing else. The whole card is a link
// to the public profile (PublicProfilePage), same as clicking a name
// anywhere else in the app.
export function UserDirectoryCard({ user }: { user: DirectoryUser }) {
  const { t } = useLanguage();

  return (
    <Link to={`/u/${encodeURIComponent(user.username)}`} className="directoryCard">
      <div className="directoryCardNames">
        <span className="directoryCardUsername">{user.username}</span>
        <span className="directoryCardName">{user.name}</span>
      </div>
      {user.bio && <p className="directoryCardBio">{user.bio}</p>}
      {user.mood && <p className="directoryCardMood">{user.mood}</p>}
      <span className="directoryCardTeam">
        {t("directory.teamLabel")} {user.teamName ?? t("directory.solo")}
      </span>
    </Link>
  );
}
