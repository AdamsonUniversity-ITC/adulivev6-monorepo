import {
  AlertTriangle,
  Archive,
  Bell,
  Bookmark,
  Check,
  CircleAlert,
  CircleDot,
  Clock,
  Eye,
  Flag,
  Heart,
  HelpCircle,
  Inbox,
  Info,
  Paperclip,
  Pin,
  Star,
  Tag,
  Target,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export const FLAG_ICON_ALLOWLIST = [
  'Flag',
  'Check',
  'Star',
  'Bookmark',
  'AlertTriangle',
  'Clock',
  'Eye',
  'Pin',
  'Tag',
  'CircleDot',
  'Bell',
  'Heart',
  'Zap',
  'Target',
  'CircleAlert',
  'Info',
  'HelpCircle',
  'Archive',
  'Inbox',
  'Paperclip',
] as const;

export type FlagIconName = (typeof FLAG_ICON_ALLOWLIST)[number];

export const FLAG_ICON_COMPONENTS: Record<FlagIconName, LucideIcon> = {
  Flag,
  Check,
  Star,
  Bookmark,
  AlertTriangle,
  Clock,
  Eye,
  Pin,
  Tag,
  CircleDot,
  Bell,
  Heart,
  Zap,
  Target,
  CircleAlert,
  Info,
  HelpCircle,
  Archive,
  Inbox,
  Paperclip,
};

export function resolveFlagIcon(name: string | null | undefined): LucideIcon | null {
  if (!name) return null;
  return FLAG_ICON_COMPONENTS[name as FlagIconName] ?? null;
}
