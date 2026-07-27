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
