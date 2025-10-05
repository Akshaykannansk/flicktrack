// components/CustomImage.tsx
import Image, { ImageProps } from 'next/image';

export default function CustomImage(props: ImageProps) {
  // Conditionally disable optimization based on environment variable
  const unoptimized =
    process.env.NEXT_DISABLE_IMAGE_OPTIMIZATION === 'true';

  return <Image {...props} unoptimized={unoptimized} />;
}
