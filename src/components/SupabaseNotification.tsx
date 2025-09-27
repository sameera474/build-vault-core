import { X, Database } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { isSupabaseConfigured } from '@/lib/supabaseClient';

export function SupabaseNotification() {
  const [isVisible, setIsVisible] = useState(true);

  if (isSupabaseConfigured || !isVisible) {
    return null;
  }

  return (
    <div className="bg-accent/10 border-b border-accent/20">
      <div className="mx-auto max-w-7xl px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-accent" />
            <p className="text-sm text-foreground">
              <strong>Setup Required:</strong> Connect to Supabase to enable authentication and data features.
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-accent text-accent hover:bg-accent hover:text-accent-foreground h-7 px-3 text-xs"
              onClick={() => window.open('/projects/9641073b-7f30-44c8-9efa-ac877659c9c7?settings=supabase', '_blank')}
            >
              Connect Supabase
            </Button>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-muted-foreground hover:text-foreground transition-smooth"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}