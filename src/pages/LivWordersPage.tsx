import { Link } from "react-router-dom";
import "./LivWordersPage.css";

export function LivWordersPage() {
  return (
    <div id="mainBody" className="livWordersPage">
      <h1>LivWorders</h1>
      <p>A directory for looking up other users and public profiles is coming soon.</p>
      <Link to="/">← Back home</Link>
    </div>
  );
}
