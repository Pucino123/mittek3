import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { da } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

const PRESETS = [
  { label: 'Seneste 7 dage', days: 7 },
  { label: 'Seneste 30 dage', days: 30 },
  { label: 'Seneste 90 dage', days: 90 },
];

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  const [isCustom, setIsCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState<Date | undefined>(dateRange.from);
  const [customTo, setCustomTo] = useState<Date | undefined>(dateRange.to);

  const handlePresetChange = (value: string) => {
    if (value === 'custom') {
      setIsCustom(true);
      return;
    }
    
    setIsCustom(false);
    const days = parseInt(value);
    onDateRangeChange({
      from: subDays(new Date(), days),
      to: new Date(),
    });
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      onDateRangeChange({ from: customFrom, to: customTo });
    }
  };

  const getCurrentPreset = (): string => {
    if (isCustom) return 'custom';
    const diffDays = Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
    const preset = PRESETS.find(p => p.days === diffDays);
    return preset ? preset.days.toString() : 'custom';
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={getCurrentPreset()} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Vælg periode" />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map(preset => (
            <SelectItem key={preset.days} value={preset.days.toString()}>
              {preset.label}
            </SelectItem>
          ))}
          <SelectItem value="custom">Brugerdefineret</SelectItem>
        </SelectContent>
      </Select>

      {isCustom && (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "w-[130px] justify-start text-left font-normal h-9",
                  !customFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customFrom ? format(customFrom, 'd. MMM', { locale: da }) : 'Fra'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customFrom}
                onSelect={setCustomFrom}
                disabled={(date) => date > new Date()}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground">–</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "w-[130px] justify-start text-left font-normal h-9",
                  !customTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customTo ? format(customTo, 'd. MMM', { locale: da }) : 'Til'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customTo}
                onSelect={setCustomTo}
                disabled={(date) => date > new Date() || (customFrom && date < customFrom)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Button size="sm" onClick={handleCustomApply} disabled={!customFrom || !customTo}>
            Anvend
          </Button>
        </div>
      )}

      {!isCustom && (
        <span className="text-sm text-muted-foreground">
          {format(dateRange.from, 'd. MMM', { locale: da })} – {format(dateRange.to, 'd. MMM yyyy', { locale: da })}
        </span>
      )}
    </div>
  );
}
