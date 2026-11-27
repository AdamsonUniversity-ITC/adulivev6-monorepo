import {
  getPersonAvatarUrl,
  getPersonDisplayName,
  getPersonInitials,
  getPersonSecondaryLine,
  type PersonDisplayInput,
} from "@/lib/person-display";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";

type PersonIdentityProps = {
  person: PersonDisplayInput;
  size?: "sm" | "default" | "lg";
  className?: string;
  showSecondary?: boolean;
  secondaryMode?: "identity" | "section";
  /** Wrap long names instead of truncating them (e.g. inside table cells). */
  wrap?: boolean;
};

export function PersonIdentity({
  person,
  size = "default",
  className,
  showSecondary = true,
  secondaryMode = "identity",
  wrap = false,
}: PersonIdentityProps) {
  const name = getPersonDisplayName(person);
  const avatarUrl = getPersonAvatarUrl(person);
  const secondary = getPersonSecondaryLine(person, secondaryMode);
  const textFit = wrap ? "break-words" : "truncate";

  return (
    <div
      className={`flex min-w-0 items-center gap-3${className ? ` ${className}` : ""}`}
    >
      <Avatar size={size} className="shrink-0">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
        <AvatarFallback>{getPersonInitials(person)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className={`${textFit} text-sm font-medium`}>{name}</p>
        {showSecondary && secondary ? (
          <p className={`text-muted-foreground ${textFit} text-xs`}>
            {secondary}
          </p>
        ) : null}
      </div>
    </div>
  );
}
