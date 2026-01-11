import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

interface StrengthResult {
  score: StrengthLevel;
  label: string;
  suggestion: string;
  color: string;
}

function calculateStrength(password: string): StrengthResult {
  if (!password) {
    return {
      score: 0,
      label: "",
      suggestion: "",
      color: "bg-muted",
    };
  }

  let score = 0;

  // Length checks
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (password.length >= 14) score += 1;

  // Character type checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  // Penalize common patterns
  if (/^[a-zA-Z]+$/.test(password)) score -= 1; // Only letters
  if (/^[0-9]+$/.test(password)) score -= 2; // Only numbers
  if (/(.)\1{2,}/.test(password)) score -= 1; // Repeated characters
  if (/^(123|abc|qwe|password|kode)/i.test(password)) score -= 2; // Common patterns

  // Normalize score to 0-4
  const normalizedScore = Math.max(0, Math.min(4, Math.floor(score / 1.5))) as StrengthLevel;

  const results: Record<StrengthLevel, StrengthResult> = {
    0: {
      score: 0,
      label: "Meget svag",
      suggestion: "Brug mindst 6 tegn med bogstaver og tal",
      color: "bg-destructive",
    },
    1: {
      score: 1,
      label: "Svag",
      suggestion: "Tilføj store bogstaver og tal",
      color: "bg-destructive/70",
    },
    2: {
      score: 2,
      label: "OK",
      suggestion: "Tilføj specialtegn for bedre sikkerhed",
      color: "bg-warning",
    },
    3: {
      score: 3,
      label: "God",
      suggestion: "God adgangskode!",
      color: "bg-success/70",
    },
    4: {
      score: 4,
      label: "Stærk",
      suggestion: "Fremragende adgangskode!",
      color: "bg-success",
    },
  };

  return results[normalizedScore];
}

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => calculateStrength(password), [password]);

  if (!password) return null;

  return (
    <div className={cn("space-y-2", className)} aria-live="polite">
      {/* Progress bar */}
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              index < strength.score ? strength.color : "bg-muted"
            )}
          />
        ))}
      </div>
      
      {/* Label and suggestion */}
      <div className="flex items-center justify-between gap-2">
        <span 
          className={cn(
            "text-xs font-medium",
            strength.score <= 1 && "text-destructive",
            strength.score === 2 && "text-warning",
            strength.score >= 3 && "text-success"
          )}
        >
          {strength.label}
        </span>
        <span className="text-xs text-muted-foreground">
          {strength.suggestion}
        </span>
      </div>
    </div>
  );
}