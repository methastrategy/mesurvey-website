import React from 'react';
import { BottomNav } from './BottomNav';

export interface NavigationProps {
  activeTab: 'knowledge' | 'calculator' | 'map';
  setActiveTab: (tab: 'knowledge' | 'calculator' | 'map') => void;
  onOpenAbout?: () => void;
}

export const Navigation: React.FC<NavigationProps> = (props) => {
  return <BottomNav {...props} />;
};

export { BottomNav };
export default Navigation;
