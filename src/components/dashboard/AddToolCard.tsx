import { Plus } from 'lucide-react';

interface AddToolCardProps {
  onClick: () => void;
  isEditMode: boolean;
}

export function AddToolCard({ onClick, isEditMode }: AddToolCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        card-interactive p-3 sm:p-5 flex flex-col items-center justify-center 
        border-2 border-dashed border-border hover:border-primary/50 
        min-h-[120px] sm:min-h-[160px] transition-all duration-200
        ${isEditMode ? 'animate-wiggle' : ''}
      `}
    >
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-2 sm:mb-3">
        <Plus className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
      </div>
      <span className="text-sm sm:text-base font-medium text-muted-foreground">
        Tilføj værktøj
      </span>
    </button>
  );
}