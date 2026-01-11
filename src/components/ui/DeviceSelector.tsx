import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Smartphone, Tablet, Laptop } from "lucide-react";

export type DeviceType = "iphone" | "ipad" | "mac";

interface DeviceSelectorProps {
  value: DeviceType;
  onChange: (device: DeviceType) => void;
}

export const DeviceSelector = ({ value, onChange }: DeviceSelectorProps) => {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as DeviceType)} className="w-full">
      <TabsList className="grid w-full grid-cols-3 h-14">
        <TabsTrigger value="iphone" className="flex items-center gap-2 text-base">
          <Smartphone className="h-4 w-4" />
          iPhone
        </TabsTrigger>
        <TabsTrigger value="ipad" className="flex items-center gap-2 text-base">
          <Tablet className="h-4 w-4" />
          iPad
        </TabsTrigger>
        <TabsTrigger value="mac" className="flex items-center gap-2 text-base">
          <Laptop className="h-4 w-4" />
          Mac
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default DeviceSelector;
