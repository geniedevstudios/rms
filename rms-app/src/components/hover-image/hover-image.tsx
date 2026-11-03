import "./hover-image.styles.css";

export function HoverImage({
  src,
  hover,
  alt,
}: {
  src: string;
  hover?: string;
  alt: string;
}) {
  return (
    <>
      <img src={src} alt={alt} />
      {hover && hover !== src ? (
        <img className="hover-shot" src={hover} alt="" />
      ) : null}
    </>
  );
}
