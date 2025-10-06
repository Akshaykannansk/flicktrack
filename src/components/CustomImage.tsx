// components/CustomImage.tsx
import Image, { ImageProps } from 'next/image';

export default function CustomImage(props: ImageProps) {
  // Conditionally disable optimization based on environment variable
  const unoptimized =
  process.env.NEXT_PUBLIC_DISABLE_IMAGE_OPTIMIZATION == 'true';
  console.log("processssssssssssssss", unoptimized, process.env.NEXT_PUBLIC_DISABLE_IMAGE_OPTIMIZATION )

  return <Image {...props} unoptimized={unoptimized} />;
}
