export default function App() {
  return (
    <main
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: '100svh',
        padding: 'var(--space-4)',
      }}
    >
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--step-3)',
          fontWeight: 300,
          margin: 0,
        }}
      >
        words<span style={{ color: 'var(--accent)' }}>·</span>viz
      </h1>
    </main>
  )
}
