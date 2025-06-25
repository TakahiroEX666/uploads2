// functions/list.js
export async function onRequestGet({ env }) {
  const list = await env.R2_BUCKET.list({ limit: 1000 });
  const files = list.objects.map(obj => ({
    name: obj.key,
    size: obj.size,
    uploaded: obj.uploaded.toISOString()
  }));
  return Response.json(files);
}
