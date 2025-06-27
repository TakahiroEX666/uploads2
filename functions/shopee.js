// api.js
export default {
  async fetch(request) {
    const urlParam = new URL(request.url).searchParams.get('url');

    if (!urlParam) {
      return new Response('Please provide a URL parameter.', { status: 400 });
    }

    try {
      const response = await fetch(urlParam, {
        headers: {
          'User-Agent': 'WhatsApp/2.24.8.76A Javascript'
        }
      });

      if (!response.ok) {
        return new Response(`Failed to fetch URL: ${response.statusText}`, { status: response.status });
      }

      const html = await response.text();
      const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i);

      if (ogImageMatch && ogImageMatch[1]) {
        return new Response(ogImageMatch[1], {
          headers: { 'Content-Type': 'text/plain' }
        });
      } else {
        return new Response('og:image not found.', { status: 404 });
      }

    } catch (error) {
      return new Response(`Error: ${error.message}`, { status: 500 });
    }
  },
};
