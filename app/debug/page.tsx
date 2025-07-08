export default function DebugPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Debug</h1>
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
        <pre className="text-sm">
          {JSON.stringify({
            SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "MISSING",
            SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "MISSING",
            NODE_ENV: process.env.NODE_ENV,
            VERCEL_ENV: process.env.VERCEL_ENV,
          }, null, 2)}
        </pre>
      </div>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        If SUPABASE_URL or SUPABASE_ANON_KEY show as &quot;MISSING&quot;, the environment variables don&apos;t have the correct NEXT_PUBLIC_ prefix.
      </p>
    </div>
  );
} 