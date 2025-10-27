import { useState } from 'react';
import { Camera, MapPin, Wifi, WifiOff, Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

interface PhotoData {
  id: string;
  dataUrl: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}

interface EnhancedMobileFeaturesProps {
  onPhotoTaken?: (photo: PhotoData) => void;
  onLocationUpdate?: (location: { latitude: number; longitude: number }) => void;
}

export function EnhancedMobileFeatures({ 
  onPhotoTaken, 
  onLocationUpdate 
}: EnhancedMobileFeaturesProps) {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { toast } = useToast();

  // Listen for online/offline status
  useState(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });

  const takePhoto = async () => {
    setIsCapturingPhoto(true);
    
    try {
      let photoDataUrl: string;

      if (Capacitor.isNativePlatform()) {
        // Use native camera on mobile devices
        const photo = await CapacitorCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
        });
        photoDataUrl = photo.dataUrl!;
      } else {
        // Use HTML file input for web/desktop
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment'; // Request camera on mobile web

        photoDataUrl = await new Promise((resolve, reject) => {
          input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) {
              reject(new Error('No file selected'));
              return;
            }

            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
          };

          input.oncancel = () => reject(new Error('Photo capture cancelled'));
          input.click();
        });
      }

      const photoData: PhotoData = {
        id: Date.now().toString(),
        dataUrl: photoDataUrl,
        location: currentLocation || undefined,
        timestamp: new Date().toISOString(),
      };

      setPhotos(prev => [...prev, photoData]);
      onPhotoTaken?.(photoData);

      toast({
        title: "Photo captured",
        description: "Photo has been saved successfully",
      });

    } catch (error: any) {
      if (error.message !== 'Photo capture cancelled') {
        console.error('Camera error:', error);
        toast({
          title: "Camera error",
          description: error.message || "Failed to capture photo",
          variant: "destructive",
        });
      }
    } finally {
      setIsCapturingPhoto(false);
    }
  };

  const getCurrentLocation = async () => {
    if (!Capacitor.isNativePlatform()) {
      // Fallback for web
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            setCurrentLocation(location);
            onLocationUpdate?.(location);
            toast({
              title: "Location captured",
              description: `Lat: ${location.latitude.toFixed(6)}, Lng: ${location.longitude.toFixed(6)}`,
            });
          },
          (error) => {
            toast({
              title: "Location error",
              description: "Failed to get current location",
              variant: "destructive",
            });
          }
        );
      }
      return;
    }

    setIsGettingLocation(true);

    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setCurrentLocation(location);
      onLocationUpdate?.(location);

      toast({
        title: "Location captured",
        description: `Lat: ${location.latitude.toFixed(6)}, Lng: ${location.longitude.toFixed(6)}`,
      });

    } catch (error: any) {
      console.error('Geolocation error:', error);
      toast({
        title: "Location error",
        description: error.message || "Failed to get current location",
        variant: "destructive",
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const deletePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const sharePhoto = async (photo: PhotoData) => {
    if (navigator.share) {
      try {
        // Convert data URL to blob for sharing
        const response = await fetch(photo.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `photo-${photo.id}.jpg`, { type: 'image/jpeg' });

        await navigator.share({
          title: 'Construction Test Photo',
          text: `Photo taken at ${new Date(photo.timestamp).toLocaleString()}`,
          files: [file],
        });
      } catch (error) {
        console.log('Error sharing:', error);
        // Fallback to download
        downloadPhoto(photo);
      }
    } else {
      downloadPhoto(photo);
    }
  };

  const downloadPhoto = (photo: PhotoData) => {
    const link = document.createElement('a');
    link.download = `photo-${photo.id}.jpg`;
    link.href = photo.dataUrl;
    link.click();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Mobile Features
            <div className={`ml-auto flex items-center gap-1 text-sm ${
              isOnline ? 'text-green-600' : 'text-red-600'
            }`}>
              {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </CardTitle>
          <CardDescription>
            Camera, GPS, and offline capabilities for field testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={takePhoto} 
              disabled={isCapturingPhoto}
              className="h-auto py-4 flex-col gap-2"
            >
              <Camera className="h-6 w-6" />
              {isCapturingPhoto ? 'Capturing...' : 'Take Photo'}
            </Button>
            
            <Button 
              onClick={getCurrentLocation} 
              disabled={isGettingLocation}
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
            >
              <MapPin className="h-6 w-6" />
              {isGettingLocation ? 'Getting Location...' : 'Get Location'}
            </Button>
          </div>

          {/* Current Location */}
          {currentLocation && (
            <div className="p-3 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">Current Location</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Lat: {currentLocation.latitude.toFixed(6)}, 
                Lng: {currentLocation.longitude.toFixed(6)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                GPS coordinates will be attached to new photos and reports
              </p>
            </div>
          )}

          {/* Offline Status */}
          {!isOnline && (
            <div className="p-3 border rounded-lg bg-yellow-50 border-yellow-200">
              <div className="flex items-center gap-2 mb-1">
                <WifiOff className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-sm text-yellow-800">Offline Mode</span>
              </div>
              <p className="text-sm text-yellow-700">
                You're working offline. Data will sync when connection is restored.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Gallery */}
      {photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Captured Photos ({photos.length})</CardTitle>
            <CardDescription>
              Photos taken during this session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.dataUrl}
                    alt={`Photo ${photo.id}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  
                  {/* Photo overlay with actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => sharePhoto(photo)}
                    >
                      <Share className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => downloadPhoto(photo)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deletePhoto(photo.id)}
                    >
                      ×
                    </Button>
                  </div>

                  {/* Photo metadata */}
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p>{new Date(photo.timestamp).toLocaleString()}</p>
                    {photo.location && (
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        GPS: {photo.location.latitude.toFixed(4)}, {photo.location.longitude.toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Mobile Field Tips</CardTitle>
          <CardDescription>
            Best practices for using the app in the field
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Camera className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <p className="font-medium text-sm">Photo Documentation</p>
              <p className="text-sm text-muted-foreground">
                Take photos of test samples, equipment setup, and site conditions for comprehensive documentation.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-green-600 mt-1" />
            <div>
              <p className="font-medium text-sm">Location Tracking</p>
              <p className="text-sm text-muted-foreground">
                Capture GPS coordinates to link test results with exact site locations for mapping and analysis.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <WifiOff className="h-5 w-5 text-yellow-600 mt-1" />
            <div>
              <p className="font-medium text-sm">Offline Work</p>
              <p className="text-sm text-muted-foreground">
                Continue working without internet. Your data will automatically sync when you're back online.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}