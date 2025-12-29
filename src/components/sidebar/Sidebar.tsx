import React, { useState } from 'react';
import { Menu, X, Home, Settings, LogOut, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFamily } from '@/contexts/FamilyContext';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onTagManager?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onTagManager }) => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const { currentFamilyId, families } = useFamily();
  const [isOpen, setIsOpen] = useState(false);

  const handleCloseSidebar = () => {
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    handleCloseSidebar();
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <>
      {/* Hamburger menu button - visible only on mobile */}
      <div className="md:hidden fixed bottom-6 right-6 z-30">
        <Button
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full w-14 h-14 shadow-lg"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Backdrop - mobile only */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-20 transition-opacity"
          onClick={handleCloseSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:static md:translate-x-0 inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-200 z-20 flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Header with logo/brand */}
        <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Home className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground">
              Calendar
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCloseSidebar}
            className="md:hidden"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* User profile section */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
              <span className="text-sidebar-primary font-semibold text-sm">
                {userInitial}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
          {families && families.length > 0 && (
            <div>
              <h3 className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wide" id="families-heading">
                {t('families')}
              </h3>
              <div className="space-y-1" role="group" aria-labelledby="families-heading">
                {families.map((family) => (
                  <button
                    key={family.id}
                    className={cn(
                      'w-full px-3 py-2 rounded-md text-sm font-medium transition-colors text-left',
                      currentFamilyId === family.id
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent'
                    )}
                    aria-current={
                      currentFamilyId === family.id ? 'page' : undefined
                    }
                    aria-label={`Select family: ${family.name}`}
                  >
                    <Users className="inline h-4 w-4 mr-2" aria-hidden="true" />
                    {family.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags management */}
          {onTagManager && (
            <button
              onClick={() => {
                onTagManager();
                handleCloseSidebar();
              }}
              className="w-full px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-left"
            >
              <span className="text-lg">🏷️</span> {t('tags')}
            </button>
          )}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-sidebar-border space-y-2">
          {/* Settings */}
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground"
            onClick={handleCloseSidebar}
          >
            <Settings className="h-4 w-4 mr-2" />
            {t('settings')}
          </Button>

          {/* Sign out */}
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive-foreground hover:bg-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t('logout')}
          </Button>
        </div>
      </aside>
    </>
  );
};
