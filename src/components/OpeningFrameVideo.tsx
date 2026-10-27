'use client';

/** Recipe videos wait on their own opening frame, never a recipe hero image. */
export default function OpeningFrameVideo({ src, className, label }: { src: string; className?: string; label: string }) {
  // The tiny media fragment requests a decoded opening frame in Safari without autoplay.
  const openingFrameSrc = src.includes('#') ? src : `${src}#t=0.001`;
  return (
    <video
      key={src}
      controls
      playsInline
      preload="metadata"
      className={className}
      aria-label={label}
      onLoadedMetadata={event => {
        const video = event.currentTarget;
        if (video.videoWidth && video.videoHeight) video.style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`;
        if (video.paused && video.currentTime === 0 && Number.isFinite(video.duration) && video.duration > 0) {
          video.currentTime = Math.min(0.001, video.duration / 2);
        }
      }}
    >
      <source src={openingFrameSrc} type="video/mp4" />
      Your browser does not support embedded video. <a href={src}>Open the recipe video directly.</a>
    </video>
  );
}
