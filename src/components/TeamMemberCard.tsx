import { Link } from "react-router-dom";
import "./TeamMemberCard.css";

export interface TeamMember {
  userId: string;
  username: string | null;
  displayName: string;
  hasUsername: boolean;
  bio: string | null;
  mood: string | null;
}

// Same small-card feel as UserDirectoryCard, but for a team's member list —
// no team field (redundant, they're all on this team) and only linked to a
// public profile when the member actually has one (hasUsername), same
// fallback rule leaderboard.ts uses for anyone who hasn't set a username.
export function TeamMemberCard({ member }: { member: TeamMember }) {
  const content = (
    <>
      <span className="teamMemberName">{member.displayName}</span>
      {member.bio && <p className="teamMemberBio">{member.bio}</p>}
      {member.mood && <p className="teamMemberMood">{member.mood}</p>}
    </>
  );

  if (member.hasUsername && member.username) {
    return (
      <Link to={`/u/${encodeURIComponent(member.username)}`} className="teamMemberCard teamMemberCardLink">
        {content}
      </Link>
    );
  }

  return <div className="teamMemberCard">{content}</div>;
}
