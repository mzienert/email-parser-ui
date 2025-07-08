export default function DebugPage() {
  const envVars = {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "MISSING",
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "MISSING",
    AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION || "MISSING",
    AWS_ACCESS_KEY_ID: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID ? "SET" : "MISSING",
    AWS_SECRET_ACCESS_KEY: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY ? "SET" : "MISSING",
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
  };

  const isCloudWatchReady = 
    envVars.AWS_REGION !== "MISSING" && 
    envVars.AWS_ACCESS_KEY_ID === "SET" && 
    envVars.AWS_SECRET_ACCESS_KEY === "SET";

  const isSupabaseReady = 
    envVars.SUPABASE_URL !== "MISSING" && 
    envVars.SUPABASE_ANON_KEY === "SET";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Environment Debug Panel</h1>
      
      {/* Status Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-lg border ${isSupabaseReady ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <h3 className="font-semibold">Supabase</h3>
          <p className={`text-sm ${isSupabaseReady ? 'text-green-700' : 'text-red-700'}`}>
            {isSupabaseReady ? '✅ Ready' : '❌ Missing Config'}
          </p>
        </div>
        
        <div className={`p-4 rounded-lg border ${isCloudWatchReady ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <h3 className="font-semibold">CloudWatch Logs</h3>
          <p className={`text-sm ${isCloudWatchReady ? 'text-green-700' : 'text-red-700'}`}>
            {isCloudWatchReady ? '✅ Ready' : '❌ Missing AWS Config'}
          </p>
        </div>
        
        <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
          <h3 className="font-semibold">Environment</h3>
          <p className="text-sm text-blue-700">
            {envVars.VERCEL_ENV || envVars.NODE_ENV || 'Unknown'}
          </p>
        </div>
      </div>

      {/* Environment Variables */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">Environment Variables</h2>
        <pre className="text-sm overflow-x-auto">
          {JSON.stringify(envVars, null, 2)}
        </pre>
      </div>

      {/* Configuration Instructions */}
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3 text-yellow-800">⚠️ CloudWatch Logs Configuration</h2>
          <p className="text-sm text-yellow-700 mb-3">
            For CloudWatch logs to work in preview/prod, you need to set these environment variables:
          </p>
          <div className="bg-white p-3 rounded font-mono text-xs">
            <div>NEXT_PUBLIC_AWS_REGION=us-west-2</div>
            <div>NEXT_PUBLIC_AWS_ACCESS_KEY_ID=your_aws_access_key</div>
            <div>NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY=your_aws_secret_key</div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3 text-blue-800">🚀 Deployment Platforms</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-blue-700">Vercel</h3>
              <p className="text-sm text-blue-600 mb-2">Set environment variables in your Vercel dashboard:</p>
              <ol className="text-sm text-blue-600 list-decimal list-inside space-y-1">
                <li>Go to your project settings in Vercel</li>
                <li>Navigate to &quot;Environment Variables&quot;</li>
                <li>Add the AWS environment variables for all environments (Production, Preview, Development)</li>
                <li>Redeploy your application</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-blue-700">Netlify</h3>
              <p className="text-sm text-blue-600 mb-2">Set environment variables in your Netlify dashboard:</p>
              <ol className="text-sm text-blue-600 list-decimal list-inside space-y-1">
                <li>Go to Site settings → Environment variables</li>
                <li>Add the AWS environment variables</li>
                <li>Trigger a new deploy</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-blue-700">Other Platforms</h3>
              <p className="text-sm text-blue-600">
                Make sure to set the environment variables in your platform&apos;s configuration panel and redeploy.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3 text-green-800">✅ Backend Resources (Shared)</h2>
          <p className="text-sm text-green-700 mb-2">
            Since this is an MVP, all environments use the same backend resources:
          </p>
          <ul className="text-sm text-green-600 list-disc list-inside space-y-1">
            <li><strong>API Base URL:</strong> https://ms3d3yxove.execute-api.us-west-2.amazonaws.com/dev</li>
            <li><strong>S3 Bucket:</strong> email-parsing-mvp-619326977873-us-west-2.s3.us-west-2.amazonaws.com</li>
            <li><strong>CloudWatch Logs:</strong> Same log groups in us-west-2 region</li>
            <li><strong>DynamoDB:</strong> Shared supplier catalog and match history</li>
          </ul>
        </div>

        {!isCloudWatchReady && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3 text-red-800">🔥 Action Required</h2>
            <p className="text-sm text-red-700">
              CloudWatch logs viewer will not work until you set the AWS environment variables in your deployment platform.
              The same AWS credentials that work in development should be used for preview and production since they all connect to the same backend.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 