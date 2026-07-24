import { Link } from "react-router-dom";
import "./AboutPage.css";

export function AboutPage() {
  return (
    <div id="mainBody" className="aboutPage">
      <h1>About</h1>
      <p>This is a Bibly Typing Game developed with love from the Toronto Good Shepherd Evangelical Church (TGSECH).</p>
      <p>
          Holy Bible, New International Version®, NIV® Copyright ©1973, 1978, 1984, 2011 by Biblica, Inc.® Used by permission. All rights reserved worldwide.
      </p>
      <p>(Express Licensing via YouVersion API)</p>
      <p>성경전서 개역한글판 (Korean Revised Version, KRV)</p>
      <Link to="/">← Back home</Link>
    </div>
  );
}
