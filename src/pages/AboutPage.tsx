import { Link } from "react-router-dom";
import "./AboutPage.css";

export function AboutPage() {
  return (
    <div id="mainBody" className="aboutPage">
      <h1>About</h1>
      <p>
        Translation credits and sourcing information for each Bible translation used in this app
        will go here.
      </p>
      <Link to="/">← Back home</Link>
    </div>
  );
}
