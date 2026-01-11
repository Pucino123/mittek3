import React from 'react';
import {
  Settings,
  Sun,
  Wifi,
  Bluetooth,
  Battery,
  Camera,
  Lock,
  Bell,
  Volume2,
  Moon,
  Plane,
  Power,
  Home,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  X,
  Check,
  Search,
  Share,
  Share2,
  Download,
  Upload,
  Trash2,
  Edit,
  Copy,
  Mail,
  Phone,
  MessageCircle,
  Globe,
  MapPin,
  Clock,
  Calendar,
  User,
  Users,
  Heart,
  Star,
  Shield,
  Eye,
  EyeOff,
  Smartphone,
  Tablet,
  Monitor,
  Cloud,
  CloudOff,
  RefreshCw,
  Zap,
  Compass,
  type LucideIcon,
} from 'lucide-react';

// Map Danish keywords to Lucide icons with specific colors
// ONLY match standalone words, not parts of other words
interface IconConfig {
  icon: LucideIcon;
  color: string;
}

const iconKeywords: Record<string, IconConfig> = {
  // === SETTINGS & SYSTEM ===
  'indstillinger': { icon: Settings, color: 'text-gray-600' },
  'generelt': { icon: Settings, color: 'text-gray-500' },
  'systemindstillinger': { icon: Settings, color: 'text-gray-600' },
  'kontrolcenter': { icon: Settings, color: 'text-gray-600' },
  
  // === POWER & BATTERY ===
  'batteri': { icon: Battery, color: 'text-green-500' },
  'batteritilstand': { icon: Battery, color: 'text-green-500' },
  'batterisundhed': { icon: Battery, color: 'text-green-500' },
  'strøm': { icon: Zap, color: 'text-yellow-500' },
  
  // === CLOUD & BACKUP ===
  'icloud': { icon: Cloud, color: 'text-blue-400' },
  'sikkerhedskopi': { icon: Cloud, color: 'text-blue-400' },
  'sikkerhedskopiering': { icon: Cloud, color: 'text-blue-400' },
  'icloud-sikkerhedskopiering': { icon: Cloud, color: 'text-blue-400' },
  
  // === TRASH & STORAGE ===
  'papirkurven': { icon: Trash2, color: 'text-gray-600' },
  'papirkurv': { icon: Trash2, color: 'text-gray-600' },
  'lagerplads': { icon: Monitor, color: 'text-gray-600' },
  
  // === UPDATES & REFRESH ===
  'softwareopdatering': { icon: RefreshCw, color: 'text-blue-500' },
  'opdateret': { icon: Check, color: 'text-green-500' },
  'opdateringer': { icon: RefreshCw, color: 'text-blue-500' },
  'genstartet': { icon: RefreshCw, color: 'text-blue-500' },
  'genstart': { icon: RefreshCw, color: 'text-blue-500' },
  
  // === CONNECTIVITY ===
  'wifi': { icon: Wifi, color: 'text-blue-500' },
  'wi-fi': { icon: Wifi, color: 'text-blue-500' },
  'bluetooth': { icon: Bluetooth, color: 'text-blue-600' },
  'flytilstand': { icon: Plane, color: 'text-orange-500' },
  'hotspot': { icon: Wifi, color: 'text-green-500' },
  
  // === SECURITY & PRIVACY ===
  'sikkerhed': { icon: Shield, color: 'text-green-600' },
  'anonymitet': { icon: Shield, color: 'text-green-600' },
  'adgangskode': { icon: Lock, color: 'text-gray-600' },
  'face id': { icon: User, color: 'text-blue-500' },
  'touch id': { icon: User, color: 'text-blue-500' },
  
  // === APPLE APPS ===
  'app store': { icon: Download, color: 'text-blue-500' },
  'safari': { icon: Compass, color: 'text-blue-500' },
  'beskeder': { icon: MessageCircle, color: 'text-green-500' },
  'imessage': { icon: MessageCircle, color: 'text-green-500' },
  'mail': { icon: Mail, color: 'text-blue-500' },
  'facetime': { icon: Phone, color: 'text-green-500' },
  'telefon': { icon: Phone, color: 'text-green-500' },
  'fotos': { icon: Camera, color: 'text-orange-400' },
  'billeder': { icon: Camera, color: 'text-orange-400' },
  'kamera': { icon: Camera, color: 'text-gray-600' },
  'kalender': { icon: Calendar, color: 'text-red-500' },
  'påmindelser': { icon: Bell, color: 'text-orange-500' },
  'noter': { icon: Edit, color: 'text-yellow-500' },
  'kort': { icon: MapPin, color: 'text-green-500' },
  'find min': { icon: MapPin, color: 'text-green-500' },
  'find my': { icon: MapPin, color: 'text-green-500' },
  'ur': { icon: Clock, color: 'text-orange-500' },
  'musik': { icon: Volume2, color: 'text-red-500' },
  
  // === MAC SPECIFIC ===
  'apple-logoet': { icon: Monitor, color: 'text-gray-600' },
  'apple-menu': { icon: Monitor, color: 'text-gray-600' },
  'styresystemet': { icon: Monitor, color: 'text-blue-500' },
  'dock': { icon: Home, color: 'text-gray-600' },
  'finder': { icon: Compass, color: 'text-blue-500' },
  'launchpad': { icon: Home, color: 'text-gray-600' },
  'skrivebord': { icon: Monitor, color: 'text-blue-500' },
  
  // === DISPLAY & SOUND ===
  'skærm': { icon: Monitor, color: 'text-gray-600' },
  'lysstyrke': { icon: Sun, color: 'text-yellow-500' },
  'lydstyrke': { icon: Volume2, color: 'text-gray-600' },
  'lyd': { icon: Volume2, color: 'text-gray-600' },
  'forstyr ikke': { icon: Moon, color: 'text-purple-500' },
  'fokus': { icon: Moon, color: 'text-purple-500' },
  'nat-tilstand': { icon: Moon, color: 'text-purple-500' },
  'night shift': { icon: Moon, color: 'text-orange-400' },
  
  // === USER & ACCOUNTS ===
  'dit navn': { icon: User, color: 'text-gray-600' },
  'apple-id': { icon: User, color: 'text-blue-500' },
  'kontakter': { icon: Users, color: 'text-gray-600' },
  
  // === NOTIFICATIONS ===
  'notifikationer': { icon: Bell, color: 'text-red-500' },
  'meddelelser': { icon: Bell, color: 'text-red-500' },
  
  // === SHARING ===
  'airdrop': { icon: Share2, color: 'text-blue-500' },
  'del': { icon: Share, color: 'text-blue-500' },
  'kopiér': { icon: Copy, color: 'text-gray-600' },
};

// Sort keywords by length (longest first) to match longer phrases before shorter ones
const sortedKeywords = Object.keys(iconKeywords).sort((a, b) => b.length - a.length);

// Parse text and insert inline icons AFTER specific keywords
// Icons appear AFTER punctuation (? . !) if present
export function parseTextWithIcons(text: string): React.ReactNode {
  if (!text) return text;
  
  const parts: React.ReactNode[] = [];
  let remainingText = text;
  let keyIndex = 0;
  let safety = 0;
  const maxIterations = 100;
  
  while (remainingText.length > 0 && safety < maxIterations) {
    safety++;
    const lowerText = remainingText.toLowerCase();
    
    // Find the EARLIEST matching keyword in the remaining text
    let earliestMatch: { keyword: string; index: number } | null = null;
    
    for (const keyword of sortedKeywords) {
      const index = lowerText.indexOf(keyword);
      
      if (index !== -1) {
        const charBefore = index > 0 ? remainingText[index - 1] : ' ';
        const charAfter = index + keyword.length < remainingText.length 
          ? remainingText[index + keyword.length] 
          : ' ';
        
        const isWordBoundaryBefore = /[\s.,!?;:()→\-"']/.test(charBefore) || index === 0;
        const isWordBoundaryAfter = /[\s.,!?;:()→\-"']/.test(charAfter) || index + keyword.length === remainingText.length;
        
        if (isWordBoundaryBefore && isWordBoundaryAfter) {
          // Check if this is earlier than our current earliest match
          // If same position, prefer longer keyword (already sorted by length)
          if (earliestMatch === null || index < earliestMatch.index) {
            earliestMatch = { keyword, index };
          }
        }
      }
    }
    
    if (earliestMatch) {
      const { keyword, index } = earliestMatch;
      
      // Add text before the match
      if (index > 0) {
        parts.push(remainingText.substring(0, index));
      }
      
      // Get the original case text for the match
      const matchedText = remainingText.substring(index, index + keyword.length);
      const config = iconKeywords[keyword];
      const IconComponent = config.icon;
      
      // Check if there's trailing punctuation that should come BEFORE the icon
      let trailingPunctuation = '';
      let afterKeywordIndex = index + keyword.length;
      
      // Collect all trailing punctuation (? . ! , ;)
      while (afterKeywordIndex < remainingText.length && /[?.!,;]/.test(remainingText[afterKeywordIndex])) {
        trailingPunctuation += remainingText[afterKeywordIndex];
        afterKeywordIndex++;
      }
      
      // Add the text + punctuation + icon
      parts.push(
        <span key={keyIndex++} className="inline-flex items-center whitespace-nowrap">
          <span>{matchedText}{trailingPunctuation}</span>
          <IconComponent 
            className={`inline-block h-4 w-4 ml-1 align-middle flex-shrink-0 ${config.color}`} 
            aria-hidden="true" 
          />
        </span>
      );
      
      remainingText = remainingText.substring(afterKeywordIndex);
    } else {
      // No match found, add remaining text and exit
      parts.push(remainingText);
      break;
    }
  }
  
  return parts.length > 0 ? <>{parts}</> : text;
}