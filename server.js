export default {
  async fetch(request, env, ctx) {
    const { method } = request;
    const url = new URL(request.url);

    // ✅ OPTIONS (CORS)
    if (method === "OPTIONS") {
      return new Response("", {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }


    if (method === "GET" && url.pathname === "/api/shopee") {
      const targetUrl = url.searchParams.get('url');

      if (!targetUrl) {
        return new Response('Please provide a "url" parameter.', { status: 400 });
      }

      try {
        const response = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'WhatsApp/2.24.8.76A Javascript' // ใช้ User-Agent ของ WhatsApp
          }
        });

        if (!response.ok) {
          // หาก Fetch ไม่สำเร็จ อาจเป็นเพราะ URL ไม่ถูกต้องหรือโดนบล็อก
          return new Response(`Failed to fetch URL: ${response.status} ${response.statusText}`, { status: response.status });
        }

        const html = await response.text();
        // ค้นหา meta tag ที่มี property="og:image"
        const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i);

        if (ogImageMatch && ogImageMatch[1]) {
          // ส่งคืน URL ของ og:image
          return new Response(ogImageMatch[1], {
            headers: {
              'Content-Type': 'text/plain',
              'Access-Control-Allow-Origin': '*' // อนุญาต CORS สำหรับการเรียกจากหน้าบ้าน
            }
          });
        } else {
          return new Response('og:image not found on the page.', { status: 404 });
        }

      } catch (error) {
        console.error("❌ Shopee OG Image Fetch Error", error);
        return new Response(`Error processing request: ${error.message}`, { status: 500 });
      }
    }

    // ✅ GET /api/list → ดูไฟล์ทั้งหมดใน R2
    if (method === "GET" && url.pathname === "/api/list") {
      try {
        const list = await env.R2_BUCKET.list();
        const files = list.objects.map(obj => ({
          name: obj.key,
          size: obj.size,
          uploaded: obj.uploaded.toISOString()
        }));

        return new Response(JSON.stringify(files), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (err) {
        console.error("❌ List error", err);
        return new Response(JSON.stringify({ error: "List failed" }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    }

    // ✅ POST / (upload)
    if (method === "POST") {
      try {
        const contentType = request.headers.get("content-type") || "";

        if (!contentType.includes("multipart/form-data")) {
          return new Response(JSON.stringify({ error: "ต้องเป็น multipart/form-data" }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }

        const formData = await request.formData();
        const file = formData.get("file");

        if (!file || typeof file === "string") {
          return new Response(JSON.stringify({ error: "ไม่พบไฟล์" }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }

        const filename = `${Date.now()}_${file.name}`;

        await env.R2_BUCKET.put(filename, file.stream(), {
          httpMetadata: {
            contentType: file.type,
          },
        });

        const publicUrl = `https://pub-bcd0954facce440ca60e0171468dafc9.r2.dev/${filename}`;

        return new Response(JSON.stringify({ url: publicUrl }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
        });
      } catch (err) {
        console.error("❌ Upload error", err);
        return new Response(JSON.stringify({ error: "Upload failed" }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
        });
      }
    }

    // ❌ หากไม่ match route ใด ๆ
    return new Response("Method not allowed or unknown route", {
      status: 405,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  },
};
