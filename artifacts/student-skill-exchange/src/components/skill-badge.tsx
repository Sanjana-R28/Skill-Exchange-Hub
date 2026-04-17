import { Badge } from "@/components/ui/badge";
import { Skill, SkillDirection } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface SkillBadgeProps {
  skill: Skill | { name: string; category: string; direction?: string };
  variant?: "default" | "outline" | "secondary";
  className?: string;
}

export function SkillBadge({ skill, variant = "secondary", className }: SkillBadgeProps) {
  const isOffered = ("direction" in skill) ? skill.direction === SkillDirection.offered : true;
  
  return (
    <Badge 
      variant={variant}
      className={cn(
        "px-2 py-1 text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-full",
        isOffered 
          ? "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20" 
          : "bg-chart-2/10 text-chart-2 hover:bg-chart-2/20 border-chart-2/20",
        className
      )}
    >
      {skill.name}
    </Badge>
  );
}