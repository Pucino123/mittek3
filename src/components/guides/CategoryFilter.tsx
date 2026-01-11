import { Button } from '@/components/ui/button';
import { Shield, Home, Trash2, Wifi, LayoutGrid, Cloud, MessageSquare, AppWindow, Battery } from 'lucide-react';

export type GuideCategory = 'alle' | 'sikkerhed' | 'hverdag' | 'batteri' | 'oprydning' | 'forbindelse' | 'icloud' | 'beskeder' | 'apps';

interface CategoryOption {
  id: GuideCategory;
  label: string;
  icon: React.ElementType;
}

const categories: CategoryOption[] = [
  { id: 'alle', label: 'Alle', icon: LayoutGrid },
  { id: 'sikkerhed', label: 'Sikkerhed', icon: Shield },
  { id: 'hverdag', label: 'Hverdag', icon: Home },
  { id: 'batteri', label: 'Batteri', icon: Battery },
  { id: 'icloud', label: 'iCloud', icon: Cloud },
  { id: 'beskeder', label: 'Beskeder', icon: MessageSquare },
  { id: 'apps', label: 'Apps', icon: AppWindow },
  { id: 'oprydning', label: 'Oprydning', icon: Trash2 },
  { id: 'forbindelse', label: 'Forbindelse', icon: Wifi },
];

interface CategoryFilterProps {
  value: GuideCategory;
  onChange: (category: GuideCategory) => void;
}

export const CategoryFilter = ({ value, onChange }: CategoryFilterProps) => {
  return (
    <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      <div className="flex gap-2 min-w-max">
        {categories.map((category) => {
          const IconComponent = category.icon;
          const isActive = value === category.id;
          
          return (
            <Button
              key={category.id}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange(category.id)}
              className={`flex-shrink-0 gap-2 rounded-full transition-all min-h-[44px] px-4 ${
                isActive 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'bg-background hover:bg-muted border-border'
              }`}
            >
              <IconComponent className="h-4 w-4" />
              {category.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryFilter;