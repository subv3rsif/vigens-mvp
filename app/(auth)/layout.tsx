export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      className="bg-background"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '28rem',
          padding: '1.5rem',
        }}
      >
        {children}
      </div>
    </div>
  )
}
