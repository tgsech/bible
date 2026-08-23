// Minimal line icons for the mobile bottom tab bar, matching the stroke
// style Sidebar.tsx already uses for its collapse toggle (currentColor,
// strokeWidth 1.6, rounded caps/joins) so they read as one consistent set.
import type { SVGProps } from "react";

function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3 9.5 10 3l7 6.5" />
      <path d="M5 8.5V17h10V8.5" />
    </Icon>
  );
}

export function ReadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M10 5.5c-1.2-1-3-1.4-5-1.4v10.8c2 0 3.8.4 5 1.4M10 5.5c1.2-1 3-1.4 5-1.4v10.8c-2 0-3.8.4-5 1.4M10 5.5v10.8" />
    </Icon>
  );
}

export function LeaderboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 17V11M10 17V3M16 17v-7" />
    </Icon>
  );
}

export function DirectoryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="7.2" cy="6.5" r="2.3" />
      <path d="M2.5 16.5c0-2.8 2.1-4.5 4.7-4.5s4.7 1.7 4.7 4.5" />
      <circle cx="14.2" cy="7.2" r="1.9" />
      <path d="M12.8 12.3c1.9.3 3.7 1.7 3.7 4.2" />
    </Icon>
  );
}

export function ProfileIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="10" cy="6.8" r="3.3" />
      <path d="M3.5 17c0-3.6 2.9-5.8 6.5-5.8s6.5 2.2 6.5 5.8" />
    </Icon>
  );
}

export function MoreIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="4.5" cy="10" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="10" cy="10" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="10" r="1.15" fill="currentColor" stroke="none" />
    </Icon>
  );
}

// Streak flame — used on the Home page's streak/stats strip.
export function FlameIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M10 2.5c1 2 .5 3.2-.4 4.4-.9 1.2-1.9 2.3-1.9 4A2.3 2.3 0 0 0 10 13a2.1 2.1 0 0 0 2-2.9c1.3.9 2 2.2 2 3.7A4 4 0 0 1 10 17.5a4.3 4.3 0 0 1-4.3-4.4C5.7 9.8 8 8.4 8 6.2 8 4.7 8.8 3.4 10 2.5Z" />
    </Icon>
  );
}

// A calendar/week grid — used on the weekly activity calendar's heading.
export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="4.5" width="14" height="12" rx="1.5" />
      <path d="M3 8h14M6.5 2.5v3M13.5 2.5v3" />
    </Icon>
  );
}

// Typing/keyboard glyph — pairs with ReadIcon (book) so "continue typing"
// vs "continue reading" cards on Home read as two distinct actions at a
// glance, not two copies of the same icon.
export function TypingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="6" width="15" height="10" rx="1.6" />
      <path d="M5.5 9.2h.01M8.5 9.2h.01M11.5 9.2h.01M14.5 9.2h.01M5.5 12.2h9" />
    </Icon>
  );
}

// A small sparkle — marks "coming soon" preview cards (daily verse,
// reading plan) as intentionally-not-wired-up-yet rather than broken.
export function SparkleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M10 3v4M10 13v4M3 10h4M13 10h4M5.6 5.6l2 2M12.4 12.4l2 2M14.4 5.6l-2 2M7.6 12.4l-2 2" />
    </Icon>
  );
}

// A right-pointing chevron — used as the trailing affordance on Home's
// "Continue" cards to read as a clear "go" action, not just plain text.
export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M7.5 4.5 13 10l-5.5 5.5" />
    </Icon>
  );
}
