import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { authorize } from '@/lib/publisher/auth';
import { getRecipeBySlug } from '@/lib/recipes';
export async function POST(req: Request) {
  try {
    const body = await req.json() as HandleUploadBody;
    if (body.type === 'blob.generate-client-token') {
      const denied = authorize(req,true); if (denied) return denied;
    } else if (body.type !== 'blob.upload-completed') return Response.json({error:'Unsupported request'}, {status:400});
    // handleUpload verifies Blob's callback signature for completion events.
    return Response.json(await handleUpload({ request:req, body,
      onBeforeGenerateToken: async pathname => {
        const match = /^publisher\/([a-z0-9-]+)\/(hero\.(jpg|png|webp)|video\.mp4)$/.exec(pathname);
        if (!match || !getRecipeBySlug(match[1])) throw new Error('Invalid upload path');
        return { addRandomSuffix:true, allowedContentTypes:match[2]==='video.mp4'?['video/mp4']:['image/jpeg','image/png','image/webp'], maximumSizeInBytes:match[2]==='video.mp4'?500*1024*1024:10*1024*1024 };
      }, onUploadCompleted:async()=>{} }));
  } catch { return Response.json({error:'Upload could not be authorized'}, {status:400}); }
}
