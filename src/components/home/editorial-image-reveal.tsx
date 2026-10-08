import Image from "next/image";

/** A clipped window onto a viewport-fixed photograph, including on touch devices.
 * No transform on the window: it would make the photograph move with its parent. */
export function EditorialImageReveal() {
  return <div className="editorial-image-reveal" aria-hidden="true">
    <div className="editorial-fixed-photo">
      <Image src="/hero/casa-playa.webp" alt="" fill sizes="100vw" className="object-cover" />
    </div>
  </div>;
}
