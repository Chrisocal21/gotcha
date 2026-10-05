import {
  Anchor,
  BookOpen,
  Building2,
  Binary,
  Binoculars,
  Bird,
  Blend,
  Bone,
  Bug,
  Calendar,
  CalendarCheck,
  CalendarDays,
  Cat,
  Clover,
  Compass,
  Crown,
  Dices,
  Dog,
  Dumbbell,
  Eye,
  Feather,
  Fish,
  Flame,
  Flower,
  Gauge,
  Gem,
  Ghost,
  Gift,
  Hand,
  Heart,
  Hexagon,
  Hourglass,
  House,
  Infinity,
  Joystick,
  Landmark,
  Layers,
  Leaf,
  Medal,
  Moon,
  MoonStar,
  Mountain,
  Footprints,
  Trees,
  Music,
  Palette,
  Panda,
  PartyPopper,
  PawPrint,
  Pi,
  Rabbit,
  Rainbow,
  Rocket,
  Shell,
  Shield,
  Skull,
  Smile,
  Snowflake,
  Sparkle,
  Sparkles,
  Sprout,
  Squirrel,
  Stamp,
  Star,
  Sun,
  Sunrise,
  Swords,
  Tally5,
  Tent,
  Trophy,
  Turtle,
  Type,
  Users,
  Wand,
  Wand2,
  Waves,
  Worm,
  Zap,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";
import type { MedalGlyph } from "../lib/badges";
import type { ClassKey } from "../lib/progress";

/*
  Every symbol in the app comes from here, so icon use stays deliberate. Symbols are used only where
  they carry meaning text can't: animal class marks (the "types" of this card game), badge emblems,
  and a few navigation controls.
*/

type Glyph = ComponentType<LucideProps>;

// Same drawing rules as the rest of the set: 24 grid, 2px round strokes.
function svgProps({ size = 24, strokeWidth = 2, color = "currentColor", className, ...rest }: LucideProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
    ...rest,
  };
}

export function Spider(props: LucideProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="12" cy="7.5" r="2" />
      <ellipse cx="12" cy="14.5" rx="3.2" ry="4" />
      <path d="M10.2 8.4 7.6 5.2 5 4.6" />
      <path d="M9.6 10.6 6 9 3 9.8" />
      <path d="M8.9 13.6 5 13.9 3 16.4" />
      <path d="M9.5 16.6 7 18.9 6.6 21.4" />
      <path d="M13.8 8.4l2.6-3.2 2.6-.6" />
      <path d="M14.4 10.6 18 9l3 .8" />
      <path d="M15.1 13.6l3.9.3 2 2.5" />
      <path d="M14.5 16.6 17 18.9l.4 2.5" />
    </svg>
  );
}

export function Frog(props: LucideProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="8" cy="7.2" r="2.6" />
      <circle cx="16" cy="7.2" r="2.6" />
      <path d="M5.7 9.7C3.5 11.1 2 13.1 2 15.5 2 19 6.5 21 12 21s10-2 10-5.5c0-2.4-1.5-4.4-3.7-5.8" />
      <path d="M8.2 14.6c1.1.9 2.4 1.4 3.8 1.4s2.7-.5 3.8-1.4" />
      <path d="M8 7.2h.01M16 7.2h.01" />
    </svg>
  );
}

export const CLASS_GLYPHS: Record<ClassKey, Glyph> = {
  mammal: PawPrint,
  bird: Bird,
  reptile: Turtle,
  amphibian: Frog,
  fish: Fish,
  insect: Bug,
  arachnid: Spider,
  statue: Landmark,
  other: Sprout,
};

const MEDAL_GLYPHS: Record<string, Glyph> = {
  cards: Layers,
  species: Binoculars,
  streak: Flame,
  lucky: Sparkles,
  legend: Crown,
  spectrum: Rainbow,
  fullday: CalendarCheck,
  stamp: Stamp,
  pack: Blend,
};

const EXTRA_GLYPHS: Record<string, Glyph> = {
  Anchor,
  BookOpen,
  Building2,
  Binary,
  Bone,
  Calendar,
  CalendarDays,
  Cat,
  Clover,
  Compass,
  Dices,
  Dog,
  Dumbbell,
  Eye,
  Feather,
  Flower,
  Gauge,
  Gem,
  Ghost,
  Gift,
  Hand,
  Heart,
  Hexagon,
  Hourglass,
  House,
  Infinity,
  Joystick,
  Leaf,
  Moon,
  MoonStar,
  Mountain,
  Footprints,
  Trees,
  Music,
  Palette,
  Panda,
  PartyPopper,
  Pi,
  Rabbit,
  Rocket,
  Shell,
  Shield,
  Skull,
  Smile,
  Snowflake,
  Sparkle,
  Squirrel,
  Star,
  Sun,
  Sunrise,
  Swords,
  Tally5,
  Tent,
  Trophy,
  Type,
  Users,
  Wand,
  Wand2,
  Waves,
  Worm,
  Zap,
};

export function glyphFor(name: MedalGlyph): Glyph {
  if (name in CLASS_GLYPHS) return CLASS_GLYPHS[name as ClassKey];
  return MEDAL_GLYPHS[name] ?? EXTRA_GLYPHS[name] ?? Medal;
}

export function ClassGlyph({ cls, ...props }: LucideProps & { cls: ClassKey }) {
  const G = CLASS_GLYPHS[cls];
  return <G {...props} />;
}

// Navigation and controls.
export {
  Check as IconCheck,
  Star as IconFounder,
  Sparkles as IconCreator,
  ChevronLeft as IconPrev,
  ChevronRight as IconNext,
  Compass as IconExplorer,
  Flame as IconStreak,
  Layers as IconCollection,
  Plus as IconPlus,
  Leaf as IconWild,
  Settings as IconSettings,
  X as IconClose,
} from "lucide-react";

// Settings rows, drawn on colored tiles like a phone's settings app.
export {
  Accessibility as IconMotion,
  Bug as IconDeveloper,
  CircleHelp as IconHowTo,
  CirclePlay as IconReplay,
  Gem as IconRarity,
  ImageDown as IconPhoto,
  MessageSquareWarning as IconReport,
  Palette as IconCustomize,
  Rotate3d as IconTilt,
  Smartphone as IconInstall,
  ShieldCheck as IconPrivacy,
  SunMoon as IconTheme,
  Trophy as IconTrophy,
  Vibrate as IconVibrate,
  Volume2 as IconSound,
} from "lucide-react";
