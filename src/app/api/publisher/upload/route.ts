import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { authorize } from '@/lib/publisher/auth';
import { VIDEO_MAX_BYTES, IMAGE_MAX_BYTES } from '@/lib/publisher/uploads';
import { getRecipeBySlug } from '@/lib/recipes';
export async function GET(req: Request) {
  const denied = authorize(req); if (denied) return denied;
  if (!(process.env.BLOB_READ_WRITE_TOKEN || process.env.PUBLIC_VIDEO_BLOB_READ_WRITE_TOKEN) || !process.env.PUBLISHER_MEDIA_ORIGIN) return Response.json({error:'Media storage is not configured. Your recipe edits are safe; contact the site administrator.'},{status:503});
  return Response.json({ok:true,videoMaxBytes:VIDEO_MAX_BYTES},{headers:{'Cache-Control':'no-store'}});
}
export async function POST(req: Request) {
  const denied = authorize(req,true); if (denied) return denied;
  if (Number(req.headers.get('content-length') || 0) > 16384) return Response.json({error:'Upload authorization request is too large'},{status:413});
  try {
    const body = await req.json() as HandleUploadBody;
    if (body.type !== 'blob.generate-client-token') return Response.json({error:'Unsupported request'}, {status:400});
    return Response.json(await handleUpload({ request:req, body, token: process.env.BLOB_READ_WRITE_TOKEN || process.env.PUBLIC_VIDEO_BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async pathname => {
        const match = /^publisher\/([a-z0-9-]+)\/(hero\.(jpg|png|webp)|video\.mp4)$/.exec(pathname);
        if (!match || !getRecipeBySlug(match[1])) throw new Error('Invalid upload path');
        return { addRandomSuffix:true, allowedContentTypes:match[2]==='video.mp4'?['video/mp4']:['image/jpeg','image/png','image/webp'], maximumSizeInBytes:match[2]==='video.mp4'?VIDEO_MAX_BYTES:IMAGE_MAX_BYTES };
      } }));
  } catch { return Response.json({error:'Upload could not be authorized'}, {status:400}); }
}
