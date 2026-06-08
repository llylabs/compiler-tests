import { ImageResponse } from 'next/og';

export const alt = 'OG Test Image';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0a0a0a',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 80,
        }}
      >
        Dynamic OG Test
      </div>
    ),
    size,
  );
}
