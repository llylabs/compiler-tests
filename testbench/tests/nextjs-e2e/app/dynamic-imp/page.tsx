import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('./HeavyChart'));

export default function DynImpPage() {
  return (
    <div>
      <h1>Dynamic Import Stage 2</h1>
      <HeavyChart label="weekly" />
    </div>
  );
}
