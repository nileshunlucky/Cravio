"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from 'next/navigation';

// Image collections with prompts
const imageCollections = [
  {
    long: {
      url: "https://higgsfield.ai/_next/image?url=https%3A%2F%2Fdqv0cqkoy5oj7.cloudfront.net%2Fuser_2vtxM3DRcDcQIjpmiCpUDF2wcAT%2Fd142f4a6-5d04-4a7d-8e73-84aa4cdc6fd4.png&w=640&q=75",
      prompt: "A young woman in low-rise jeans and a slightly cropped white tee layered under a soft, slightly oversized brown leather jacket stands casually in a modern airport terminal near floor-to-ceiling windows. She wears relaxed white sneakers, and sleek black headphones rest comfortably around her neck, complementing her natural, loose hair. Her carry-on suitcase, a streamlined matte black model, leans gently beside her. Warm, slightly underexposed ambient daylight streams through large windows, casting delicate shadows and highlighting the tactile grain of her clothing and natural skin textures. Captured from a spontaneous mid-shot with a subtle tilt and off-center framing, the image conveys an unposed, intimate moment of waiting. The clean, industrial airport architecture with muted tones and polished surfaces enhances the natural lighting and authentic textural realism characteristic of candid iPhone photography, perfectly embodying the relaxed, sporty-chic travel vibe."
    },
    small: [
      {
        url: "https://orchestration.civitai.com/v2/consumer/blobs/BY5K3G0TE1R2BCYA7PMFNY9JA0.jpeg",
        prompt: "A woman with long wavy hair and sunglasses sits near the window of a private jet, dressed in a black and beige designer jacket and high beige boots. A black leather bag with metal details rests beside her. The cabin interior is sharp and refined."
      },
      {
        url: "https://higgsfield.ai/_next/image?url=https%3A%2F%2Fdqv0cqkoy5oj7.cloudfront.net%2Fuser_2zGhKQBhNr4agrkbTBHMUGRiaSQ%2F9672bd09-4f89-4995-a714-1f025e70a8ce.png&w=640&q=75",
        prompt: "A fashionable young woman walks naturally across a wide pedestrian crosswalk wearing baggy denim cargo pants with visible seams and a khaki tank top tucked in. She sports black cat-eye sunglasses and minimal silver jewelry. Her relaxed, casual pose shows one hand in her pocket and the other holding a takeaway coffee cup. The setting is just road and pedestrian crosswalk with clear white zebra crossing lines on a textured asphalt surface; no urban or city elements are visible. Lighting is neutral, natural daylight with soft overcast shadows and realistic exposure, mimicking genuine street surveillance footage. Textural details include visible skin pores, textured denim fabric with visible seams, subtle wrinkles on the tank top, slight scuff marks on her shoes, and the gritty, slightly uneven asphalt below. The wide, high-angle framing is candid and slightly impersonal, capturing minor motion blur on one arm and partial cropping of her legs for authenticity. The scene has muted, natural colors and documentary-style realism without enhancements. candid street camera photo, high-angle traffic camera shot, documentary-style realism  —high-angle shot, wide shot, hyper-real texture fidelity"
      },
      {
        url: "https://higgsfield.ai/_next/image?url=https%3A%2F%2Fdqv0cqkoy5oj7.cloudfront.net%2Fuser_2vVDbuYVi2MJIPsi6xaVxFcvKjD%2F594bd3f2-853d-4efd-8008-b842c5c209a8.png&w=640&q=75",
        prompt: "	12.	A woman sips from a cocktail glass, partially hidden under dense foam, resting one arm along the edge of a modern bathtub. Intimate warm lighting. iPhone photo."
      },
      {
        url: "https://higgsfield.ai/_next/image?url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fcontent_user_id%2F43559c28-2878-4db2-8e5f-4505b5464de0.jpeg&w=640&q=75",
        prompt: "A woman reclining on an expansive king bed dressed in sleek black satin pajamas accented with delicate feathered cuffs, mid-bite into a slice of room-service pizza. Her eyes close softly as she savors the rich comfort, bathed in the amber glow of twin vintage lamps casting warm halos across an ornate headboard and lush, rumpled white linens. Plush pillows support her relaxed pose, one leg curled beneath and the other stretched leisurely forward, embodying a serene stillness. Nearby, silver cloches gleam softly, reflecting the lamp light and whispering of an indulgent feast not yet uncovered. The silk pajamas shimmer subtly with every slight crease, skin glowing gently in the cozy light, and the entire scene hums with slow, sumptuous ease—luxury lived quietly with effortless charm and the soft imperfection of a lived-in nest. The iPhone's sensor captures gentle grain and natural shadows, framing the moment like a private diary entry cloaked in warmth and sensual stillness. —leisure-suite snapshot, shot on iPhone"
      },
      {
        url: "https://higgsfield.ai/_next/image?url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fcontent_user_id%2Fb42fb8f2-f301-42b9-824c-ea18addc1386.jpeg&w=640&q=75",
        prompt: "A casually candid iPhone-styled photo capturing a solo woman seated on a narrow, slightly worn Parisian stone stair beside an aged textured doorway. She wears a refined beige trench coat from Totême layered over subtle soft tailoring from COS, paired with sleek brown leather loafers, exemplifying minimalist sophistication. One relaxed hand rests gently on a structured Polène handbag placed softly beside her, showing visible leather grain and soft creases, while the other hand holds a clear takeaway coffee cup with subtle condensation and authentic translucency. Her medium-length hair is effortlessly styled in loose waves, strands softly framing her calm, neutral expression gazing quietly across the cobblestone street. The ambient natural daylight softly diffuses across the scene, casting gentle shadows and subtle highlights that reveal fine skin texture and delicate fabric wrinkles. The informal composition is slightly tilted with the woman positioned off-center, capturing an intuitive, unposed moment filled with authentic urban Parisian charm, perfectly emulating genuine candid iPhone street photography."
      },
      {
        url: "https://orchestration.civitai.com/v2/consumer/blobs/8HB5D4RT37NNVYRJ5S2SF1ZCP0.jpeg",
        prompt: "An elevated wide-angle photo realistically taken on an iPhone features a tall, androgynous figure casually sipping an iced beverage while standing in a whimsically artistic courtyard densely arranged with antique, ornately framed mirrors and varied lush potted greenery. They look directly upward into the camera with a calm, natural neutral expression, their hair styled in a subtly tousled, gender-neutral cut. Their uniquely reinterpreted outfit includes an asymmetric, smooth-textured satin blouse in a soft metallic hue with creative sleeve and collar detailing, tucked into high-waisted silk trousers featuring a fluid drape and gentle sheen distinctively different from described examples. They carry an imaginatively designed baguette-shaped purse in complementary tones, accented with unconventional hardware and modern minimalist straps. The surrounding antique mirrors craft layered, softly distorted reflections contributing to an ethereal atmosphere under soft natural daylight filtering gently through. Visible textures encompass light fabric creases, realistic silk sheen, delicate hair strands, slightly dewy skin surfaces, and richly detailed plant leaves with subtle imperfections. The composition embraces authentic exaggerated wide-angle distortion and casual elevated camera angle typical of iPhone snapshots, capturing the subject's engaging upward gaze and natural posture within a lively, textured courtyard scene. This spontaneous snapshot embodies a stylishly playful, genuinely neutral moment enhanced by the dreamy mirror reflections and vibrant urban greenery, perfectly reflecting the dynamic and authentic aesthetic of wide-angle iPhone photography."
      },
      {
        url: "https://higgsfield.ai/_next/image?url=https%3A%2F%2Fdqv0cqkoy5oj7.cloudfront.net%2Fuser_2vJeXh2tq7W63Dx5grApkN7sGn9%2F8ef5bee2-463d-4b53-8c71-563044e0b540.png&w=640&q=75",
        prompt: "A female model is reclined naturally on a low-profile vintage velvet chair upholstered in muted rusty brown, set against a seamless warm beige backdrop that captures the refined 1990s editorial fashion ambiance with high realism and subtle texture reminiscent of scanned film. She wears sheer beige tights paired with a fine ribbed cropped tank in soft rust, the delicate knit texture gently evident as it contours smoothly to her body without tension. Her pose is relaxed and unforced, limbs softly folded with one hand lightly touching her ankle and the other resting gently on the chair's armrest, revealing natural muscle and bone structure without stiffness or elongation. Her skin glows with a soft velvet matte finish, harmonizing seamlessly with the muted earthy palette. Her hair is styled in loose, softly tousled layers that frame her face naturally, free of any artificial shine. Soft diffuse warm lighting envelops the scene evenly, creating smooth gradations of shadow that sculpt her form and subtly emphasize the fabric's tactile qualities. Medium framing allows for thoughtful negative space that highlights the natural asymmetry of her pose and the fluidity of her limbs. Her gaze is candid and directed softly off-frame, evoking quiet introspection and calm vulnerability. Overlayed with authentic fine paper grain and a subtle vintage blur, the image evokes the tactile depth and delicate imperfections of lightly scanned analog editorial prints, with a softly desaturated pastel palette leaning toward warm beige, faded rust, and cream whites. The overall composition exudes understated 1990s editorial elegance with minimalist studio simplicity and refined photographic softness."
      },
      {
        url: "https://higgsfield.ai/_next/image?url=https%3A%2F%2Fdqv0cqkoy5oj7.cloudfront.net%2Fuser_2vVDbuYVi2MJIPsi6xaVxFcvKjD%2Fa0ad67e1-2ba7-45f4-9aed-db76c6a23634.png&w=640&q=75",
        prompt: "A woman clad in a softly flowing white silk gown emits a gentle, radiant white glow that softly diffuses around her figure as she leans spontaneously against a mossy boulder within a shadowy dark green forest. Her long golden hair cascades loosely, catching faint glimmers of the muted overcast daylight filtering through the dense, damp foliage overhead. Her pose is natural and uncontrived. Her skin reveals delicate textures of natural warmth and subtle pores, slightly flushed by the cool, humid forest air. The deep green leaves and moss around her shimmer with moisture, enveloped by a heavy, thin ethereal white fog that drifts through the scene. The white silk fabric of her gown wrinkles gently at the folds, emphasizing tangible texture. The image is captured from a casual, slightly angled iPhone perspective, enhanced by soft focus, light haze, and the characteristic warm, diffuse shadows typical of spontaneous forest shade photography."
      },
      {
        url: "https://higgsfield.ai/_next/image?url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fcontent_user_id%2Fd79a7e40-b3d0-4946-9713-160761d05947.jpeg&w=640&q=75",
        prompt: "Bathed in the gentle glow of late afternoon, a sleek young woman with carefree tousled hair leans against a graffiti-streaked brick wall in a quiet alley. Her vintage windbreaker catches the sun's warm light, the fabric's subtle grain visible against the cooler hues of concrete and shadow. Nearby, a discarded cassette tape lies half-buried in cracked pavement, its plastic case scratched and slightly faded, hinting at forgotten melodies. The scene hums with a spontaneous casualness — passersby blurred in motion, streetlight flickers barely catching the edges of the frame, a sudden breeze stirring loose papers nearby. Soft lens flares glimmer faintly across the composition, emphasizing the urban textures and the intimate intersection of chance and style that define this low city pop moment."
      }
    ]
  },
];

// Skeleton component
function ImageSkeleton({ className }: { className?: string }) {
  return (
    <div className={`bg-zinc-900 animate-pulse rounded ${className}`} />
  );
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      duration: 0.6
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4
    }
  },
};

function ImageCard({
  src,
  alt,
  className,
  isLoading,
  onLoad,
  onClick
}: {
  src: string;
  alt: string;
  className?: string;
  isLoading: boolean;
  onLoad: () => void;
  onClick?: () => void;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group bg-zinc-900 ${className}`}
      onClick={onClick}
      variants={itemVariants}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Show skeleton only when loading and no error */}
      {isLoading && !imageError && (
        <div className="absolute inset-0 z-10">
          <ImageSkeleton className="w-full h-full" />
        </div>
      )}

      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-500 group-hover:brightness-110 ${isLoading && !imageError ? 'opacity-0' : 'opacity-100'
          }`}
        loading="lazy"
        onLoad={() => {
          console.log(`Image loaded: ${src}`);
          onLoad();
        }}
        onError={(e) => {
          console.error('Image failed to load:', src);
          setImageError(true);
          onLoad(); // Hide skeleton even on error
        }}
      />

      {/* Error fallback */}
      {imageError && (
        <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
          <p className="text-gray-400 text-xs">Failed to load</p>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
}

function InstagramGallery({
  images,
  index
}: {
  images: {
    long: { url: string; prompt: string };
    small: { url: string; prompt: string }[]
  };
  index: number;
}) {
  const router = useRouter();
  const [loadingStates, setLoadingStates] = useState(() => ({
    long: true,
    small: new Array(images.small.length).fill(true)
  }));

  const handleLongImageLoad = () => {
    console.log(`Long image ${index} loaded`);
    setLoadingStates(prev => ({ ...prev, long: false }));
  };

  const handleSmallImageLoad = (idx: number) => {
    console.log(`Small image ${index}-${idx} loaded`);
    setLoadingStates(prev => ({
      ...prev,
      small: prev.small.map((loading, i) => i === idx ? false : loading)
    }));
  };

  const handleImageClick = (prompt: string, imageUrl: string) => {
    const encodedPrompt = encodeURIComponent(prompt);
    const encodedImage = encodeURIComponent(imageUrl);
    router.push(`/admin/canvas?prompt=${encodedPrompt}&referenceImage=${encodedImage}`);
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingStates({
        long: false,
        small: new Array(images.small.length).fill(false)
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [images.small.length]);

  const allImages = [images.long, ...images.small];

  return (
    <motion.div
      className="w-full"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-20px" }}
    >
      {/* Instagram Explore Grid Pattern with proper gap handling */}
      <div className="grid grid-cols-3 gap-0.5 md:gap-1">
        
        {/* Hero image - properly sized with gap consideration */}
        <div className="col-span-2 row-span-2">
          <ImageCard
            src={allImages[0].url}
            alt="Featured image"
            className="w-full h-full aspect-square"
            isLoading={loadingStates.long}
            onLoad={handleLongImageLoad}
            onClick={() => handleImageClick(allImages[0].prompt, allImages[0].url)}
          />
        </div>

        {/* Right side images that align with hero */}
        <div className="col-span-1">
          <ImageCard
            src={allImages[1].url}
            alt="Grid image 1"
            className="w-full aspect-square"
            isLoading={loadingStates.small[0]}
            onLoad={() => handleSmallImageLoad(0)}
            onClick={() => handleImageClick(allImages[1].prompt, allImages[1].url)}
          />
        </div>

        <div className="col-span-1">
          <ImageCard
            src={allImages[2].url}
            alt="Grid image 2"
            className="w-full aspect-square"
            isLoading={loadingStates.small[1]}
            onLoad={() => handleSmallImageLoad(1)}
            onClick={() => handleImageClick(allImages[2].prompt, allImages[2].url)}
          />
        </div>

        {/* Row 2 - 3 equal squares */}
        {allImages.slice(3, 6).map((image, idx) => (
          <div key={idx + 3} className="col-span-1">
            <ImageCard
              src={image.url}
              alt={`Grid image ${idx + 3}`}
              className="w-full aspect-square"
              isLoading={loadingStates.small[idx + 2]}
              onLoad={() => handleSmallImageLoad(idx + 2)}
              onClick={() => handleImageClick(image.prompt, image.url)}
            />
          </div>
        ))}

        {/* Row 3 - 2 squares + 1 tall image */}
        <div className="col-span-1">
          <ImageCard
            src={allImages[6].url}
            alt="Grid image 6"
            className="w-full aspect-square"
            isLoading={loadingStates.small[5]}
            onLoad={() => handleSmallImageLoad(5)}
            onClick={() => handleImageClick(allImages[6].prompt, allImages[6].url)}
          />
        </div>

        <div className="col-span-1">
          <ImageCard
            src={allImages[7].url}
            alt="Grid image 7"
            className="w-full aspect-square"
            isLoading={loadingStates.small[6]}
            onLoad={() => handleSmallImageLoad(6)}
            onClick={() => handleImageClick(allImages[7].prompt, allImages[7].url)}
          />
        </div>

        <div className="col-span-1 row-span-2">
          <ImageCard
            src={allImages[8].url}
            alt="Grid image 8"
            className="w-full h-full aspect-[1/2]"
            isLoading={loadingStates.small[7]}
            onLoad={() => handleSmallImageLoad(7)}
            onClick={() => handleImageClick(allImages[8].prompt, allImages[8].url)}
          />
        </div>

        {/* Row 4 - Wide image (spans 2 columns) */}
        <div className="col-span-2">
          <ImageCard
            src={allImages[9].url}
            alt="Grid image 9"
            className="w-full aspect-[2/1]"
            isLoading={loadingStates.small[8]}
            onLoad={() => handleSmallImageLoad(8)}
            onClick={() => handleImageClick(allImages[9].prompt, allImages[9].url)}
          />
        </div>

        {/* Row 5 - Remaining squares */}
        {allImages.slice(10, 12).map((image, idx) => (
          <div key={idx + 10} className="col-span-1">
            <ImageCard
              src={image.url}
              alt={`Grid image ${idx + 10}`}
              className="w-full aspect-square"
              isLoading={loadingStates.small[idx + 9]}
              onLoad={() => handleSmallImageLoad(idx + 9)}
              onClick={() => handleImageClick(image.prompt, image.url)}
            />
          </div>
        ))}

        {/* Optional 12th image if it exists */}
        {allImages[12] && (
          <div className="col-span-1">
            <ImageCard
              src={allImages[12].url}
              alt="Grid image 12"
              className="w-full aspect-square"
              isLoading={loadingStates.small[11]}
              onLoad={() => handleSmallImageLoad(11)}
              onClick={() => handleImageClick(allImages[12].prompt, allImages[12].url)}
            />
          </div>
        )}

      </div>
    </motion.div>
  );
}


export default function PremiumGalleryLayout() {
  return (
    <div className="min-h-screen bg-black">
      <div className="w-full px-1 md:px-2 lg:px-4 py-4 md:py-8">
        <div className="space-y-2 md:space-y-4">
          {imageCollections.map((collection, index) => (
            <InstagramGallery
              key={index}
              images={collection}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}