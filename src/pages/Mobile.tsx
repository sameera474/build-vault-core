import { EnhancedMobileFeatures } from '@/components/EnhancedMobileFeatures';

export default function Mobile() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mobile Features</h1>
        <p className="text-muted-foreground">
          Camera, GPS, and offline capabilities for field testing
        </p>
      </div>
      <EnhancedMobileFeatures />
    </div>
  );
}