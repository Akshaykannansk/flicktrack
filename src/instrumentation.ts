
// src/instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { BaselimeSDK, VercelPlugin, BetterHttpInstrumentation } = await import('@baselime/node-opentelemetry');

    const sdk = new BaselimeSDK({
      serverless: true,
      service: 'flicktrack',
      baselimeKey: process.env.BASELIME_API_KEY,
      plugins: [
        new VercelPlugin(),
        new BetterHttpInstrumentation({ 
            captureBody: true, 
            requestHook: (span, request) => {
                if(request.headers) {
                    const headers = JSON.parse(JSON.stringify(request.headers));
                    // Supress headers as they are noisy
                    if(headers) {
                       span.setAttribute('http.request.headers', JSON.stringify({}));
                    }
                }
            }
        }),
      ],
    });

    sdk.start();
