/**
 * Sistema de ícones para workspaces
 * Cada workspace tem um ícone exclusivo que pode ser alterado
 */

import {
  Heart,
  Users,
  Home,
  Briefcase,
  Star,
  Sparkles,
  Crown,
  Flame,
  Zap,
  Coffee,
  Music,
  Camera,
  Book,
  Palette,
  Rocket,
  Globe,
  Moon,
  Sun,
  Cloud,
  Umbrella,
  type LucideIcon,
} from 'lucide-react';

export interface WorkspaceIcon {
  id: string;
  icon: LucideIcon;
  label: string;
  color: string;
}

export const WORKSPACE_ICONS: WorkspaceIcon[] = [
  { id: 'heart', icon: Heart, label: 'Coração', color: '#FF6B9D' },
  { id: 'users', icon: Users, label: 'Pessoas', color: '#7B68EE' },
  { id: 'home', icon: Home, label: 'Casa', color: '#6BCF7F' },
  { id: 'briefcase', icon: Briefcase, label: 'Trabalho', color: '#4A90E2' },
  { id: 'star', icon: Star, label: 'Estrela', color: '#FFD93D' },
  { id: 'sparkles', icon: Sparkles, label: 'Brilho', color: '#FF9FF3' },
  { id: 'crown', icon: Crown, label: 'Coroa', color: '#FFA500' },
  { id: 'flame', icon: Flame, label: 'Fogo', color: '#FF4500' },
  { id: 'zap', icon: Zap, label: 'Raio', color: '#FFD700' },
  { id: 'coffee', icon: Coffee, label: 'Café', color: '#8B4513' },
  { id: 'music', icon: Music, label: 'Música', color: '#9B59B6' },
  { id: 'camera', icon: Camera, label: 'Câmera', color: '#E74C3C' },
  { id: 'book', icon: Book, label: 'Livro', color: '#3498DB' },
  { id: 'palette', icon: Palette, label: 'Paleta', color: '#E67E22' },
  { id: 'rocket', icon: Rocket, label: 'Foguete', color: '#1ABC9C' },
  { id: 'globe', icon: Globe, label: 'Globo', color: '#16A085' },
  { id: 'moon', icon: Moon, label: 'Lua', color: '#95A5A6' },
  { id: 'sun', icon: Sun, label: 'Sol', color: '#F39C12' },
  { id: 'cloud', icon: Cloud, label: 'Nuvem', color: '#BDC3C7' },
  { id: 'umbrella', icon: Umbrella, label: 'Guarda-chuva', color: '#E74C3C' },
];

/**
 * Gera um ícone aleatório para novo workspace
 */
export function generateRandomIcon(): string {
  const randomIndex = Math.floor(Math.random() * WORKSPACE_ICONS.length);
  return WORKSPACE_ICONS[randomIndex].id;
}

/**
 * Busca ícone pelo ID
 */
export function getIconById(iconId: string | null): WorkspaceIcon {
  if (!iconId) {
    return WORKSPACE_ICONS[0]; // Default: heart
  }

  const icon = WORKSPACE_ICONS.find((i) => i.id === iconId);
  return icon || WORKSPACE_ICONS[0];
}

/**
 * Busca ícone pelo índice (para compatibilidade com dados antigos)
 */
export function getIconByIndex(index: number): WorkspaceIcon {
  if (index < 0 || index >= WORKSPACE_ICONS.length) {
    return WORKSPACE_ICONS[0];
  }
  return WORKSPACE_ICONS[index];
}
