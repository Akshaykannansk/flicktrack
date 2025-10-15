
"use client";

import { useState, useRef } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface ImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  image: string | null;
  onCropComplete: (croppedImage: Blob) => void;
}

// Function to create a canvas and draw the cropped image
function getCroppedImg(
  image: HTMLImageElement,
  crop: Crop,
  fileName: string
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return Promise.reject(new Error('Failed to get canvas context'));
  }

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      // You can remove the filename assignment if you manage it elsewhere
      // (blob as any).name = fileName;
      resolve(blob);
    }, 'image/png');
  });
}

export function ImageCropper({ isOpen, onClose, image, onCropComplete }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    imgRef.current = e.currentTarget;
    const { width, height } = e.currentTarget;
    const newCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1, // Aspect ratio 1:1
        width,
        height
      ),
      width,
      height
    );
    setCrop(newCrop);
  };

  const handleCrop = async () => {
    if (!imgRef.current || !crop || !crop.width || !crop.height) {
      return;
    }
    setIsLoading(true);
    try {
      const croppedImageBlob = await getCroppedImg(
        imgRef.current,
        crop,
        'newAvatar.png'
      );
      onCropComplete(croppedImageBlob);
    } catch (e) {
      console.error('Error cropping image', e);
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  if (!image) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crop Your New Avatar</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center p-4">
            <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                aspect={1}
                minWidth={128} // Minimum crop width in pixels
                minHeight={128}
                circularCrop
            >
                <img 
                    src={image}
                    onLoad={handleImageLoad} 
                    alt="Avatar to crop" 
                    style={{ maxHeight: '70vh' }}
                />
            </ReactCrop>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleCrop} disabled={isLoading}>
            {isLoading ? 'Cropping...' : 'Save Avatar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
