export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response("", {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method === "POST") {
      try {
        const contentType = request.headers.get("content-type") || "";

        if (!contentType.includes("multipart/form-data")) {
          return new Response(JSON.stringify({ error: "ต้องเป็น multipart/form-data" }), {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        }

        const formData = await request.formData();
        const file = formData.get("file");

        if (!file || typeof file === "string") {
          return new Response(JSON.stringify({ error: "ไม่พบไฟล์" }), {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
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
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      } catch (err) {
        console.error("❌ Upload error", err);
        return new Response(JSON.stringify({ error: "Upload failed" }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
    }

    return new Response("Method not allowed", { status: 405 });
  },
};

