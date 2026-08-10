import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Raquel & Filipe — Casamento 29.11.2026';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#FFF8F3',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          position: 'relative',
        }}
      >
        {/* Blob decorativo */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '700px',
            height: '700px',
            borderRadius: '50%',
            background: 'rgba(139, 94, 60, 0.05)',
          }}
        />

        <p
          style={{
            color: '#8B5E3C',
            fontSize: '16px',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            margin: '0',
            fontFamily: 'Georgia, serif',
            opacity: 0.7,
          }}
        >
          ✦  Você está convidado  ✦
        </p>

        <h1
          style={{
            color: '#8B5E3C',
            fontSize: '96px',
            fontWeight: '400',
            margin: '0',
            fontFamily: 'Georgia, serif',
            lineHeight: 1,
          }}
        >
          Raquel &amp; Filipe
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '80px', height: '1px', background: 'rgba(139,94,60,0.3)' }} />
          <span style={{ color: '#8B5E3C', fontSize: '18px', opacity: 0.5 }}>✦</span>
          <div style={{ width: '80px', height: '1px', background: 'rgba(139,94,60,0.3)' }} />
        </div>

        <p
          style={{
            color: '#6B5040',
            fontSize: '28px',
            margin: '0',
            fontFamily: 'Georgia, serif',
          }}
        >
          29 de Novembro de 2026 · Arujá, SP
        </p>
      </div>
    ),
    { ...size },
  );
}
