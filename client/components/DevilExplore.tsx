"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from 'next/navigation';

// Image collections with prompts 
const imageCollections = [
    {
        image: [
            {
                url: "https://res.cloudinary.com/deoxpvjjg/image/upload/v1754737069/0_ar4bgx.jpg",
                prompt: "Hyper-realistic, high-fashion portrait of a young man with tousled, voluminous jet-black hair styled with natural texture falling slightly over his forehead. He is wearing a deep blood red tailored suit jacket over a black shirt, paired with fitted matte black gloves. Multiple chunky silver and black rings adorn his gloved fingers. His hands are raised to partially cover the lower half of his face in an artistic, mysterious pose, fingers framing his eyes. His ears are adorned with multiple piercings including small hoops and a black cross earring. Soft, moody studio lighting with a neutral beige background, dramatic shadows, cinematic editorial photography style, sharp details, 8K resolution, fashion magazine aesthetic."
            },
            {
                url: "https://res.cloudinary.com/deoxpvjjg/image/upload/v1754564279/755e85ce-f762-4874-b55e-6e647b7289f8_qmija9.png",
                prompt: "A fierce young woman stands against a deep blood-red studio backdrop, shown from mid-thigh up in a casual, slightly angled mid-close shot. Her long jet-black hair is styled in a messy half-up ponytail, adorned with small white clips, with natural flyaways visible. She wears an oversized black sweater featuring a vivid graphic of a melting monstrous green face with yellow eyes and dripping red accents resembling flames, the fabric textured with gentle wrinkles. Below, white frilly bloomers peek out subtly. Her tattooed legs display large, detailed black floral and demonic motifs, layered with loosely hanging metal chains as accessories. Chunky black platform shoes with white frilly socks complete her look. She wears bold winged eyeliner and deep lipstick with natural skin texture visible on her pale face. Lighting is high-contrast studio but softened to mimic iPhone warmth, lending an eerie yet playful atmosphere. The composition feels relaxed and spontaneous, with slight tilt and imperfect framing."
            },
            {
                url: "https://res.cloudinary.com/deoxpvjjg/image/upload/v1754737086/0_u0oghy.jpg",
                prompt: "A striking, high-fashion portrait of a confident young woman with wavy chin-length red hair and blunt bangs, her head tilted slightly back in a bold, elegant pose, wearing a deep V-neck black outfit, vivid glossy red lips, and flawless porcelain skin, captured under dramatic cinematic lighting with a fiery orange-to-red gradient background for an intense, moody, editorial look."
            },
            {
                url: "https://res.cloudinary.com/deoxpvjjg/image/upload/v1755011953/c01c4da6-df81-44d3-a4cd-6de4e94c80fe_fen6wp.png",
                prompt: "Create a cinematic portrait of an extremely muscular yet athletically proportioned young man with a perfectly sculpted physique featuring pronounced chest definition, six-pack abs, powerful shoulders and arms with visible veins, dark textured undercut hair with messy styling on top, facing the camera directly with an intense yet gentle expression as he gazes down at a single long-stemmed dark crimson rose held delicately between both hands at mid-chest level, wearing only black formal trousers, shot against a rich blood-red gradient background that transitions from deep burgundy to bright red, with dramatic chiaroscuro lighting creating strong shadows and highlights that emphasize every muscle contour, professional studio photography with high contrast, razor-sharp focus, and cinematic color grading."
            },
            {
                url: "https://res.cloudinary.com/deoxpvjjg/image/upload/v1754737077/0_ma9v4l.jpg",
                prompt: "A moody, artistic portrait of a young man with curly dark hair and piercing blue eyes, standing against a vivid crimson red background, his face partially obscured by a narrow strip of dramatic shadow across the eyes, wearing a dark shirt that blends into the shadows, with high-contrast cinematic lighting creating a mysterious, intense atmosphere."
            },
            {
                url: "https://res.cloudinary.com/deoxpvjjg/image/upload/v1754737094/0_jhijx7.jpg",
                prompt: "A sharp, high-fashion studio portrait of a poised young man with flawless pale skin and dark styled hair, wearing an elegant black textured suit with satin lapels, standing confidently with one hand in his pocket against a vivid solid red background, illuminated by dramatic, directional lighting that casts deep shadows for a bold, cinematic look."
            },
        ]
    },
];

// Skeleton component
function ImageSkeleton({ className }: { className?: string }) {
    return (
        <div className={`bg-zinc-900 animate-pulse rounded-lg ${className}`} />
    );
}

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            duration: 0.6
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5
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
            className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl group bg-zinc-900 rounded-lg ${className}`}
            onClick={onClick}
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
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
                className={`w-full h-auto object-contain transition-all duration-500 group-hover:brightness-110 ${isLoading && !imageError ? 'opacity-0' : 'opacity-100'
                    }`}
                loading="lazy"
                onLoad={() => {
                    console.log(`Image loaded: ${src}`);
                    onLoad();
                }}
                onError={(e) => {
                    console.error('Image failed to load:', e);
                    setImageError(true);
                    onLoad(); // Hide skeleton even on error
                }}
            />

            {/* Error fallback */}
            {imageError && (
                <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center rounded-lg">
                    <p className="text-gray-400 text-xs">Failed to load</p>
                </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
        </motion.div>
    );
}

function PinterestGallery({
    images,
    index
}: {
    images: {
        image: { url: string; prompt: string }[]
    };
    index: number;
}) {
    const router = useRouter();

    // Flatten all images into a single array
    const allImages = [...images.image];

    const [loadingStates, setLoadingStates] = useState(() =>
        new Array(allImages.length).fill(true)
    );

    const handleImageLoad = (idx: number) => {
        console.log(`Image ${index}-${idx} loaded`);
        setLoadingStates(prev =>
            prev.map((loading, i) => i === idx ? false : loading)
        );
    };

    const handleImageClick = (prompt: string, imageUrl: string) => {
        const encodedPrompt = encodeURIComponent(prompt);
        const encodedImage = encodeURIComponent(imageUrl);
        router.push(`/admin/canvas?prompt=${encodedPrompt}&referenceImage=${encodedImage}`);
    };

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setLoadingStates(new Array(allImages.length).fill(false));
        }, 3000);

        return () => clearTimeout(timer);
    }, [allImages.length]);

    return (
        <motion.div
            className="w-full"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
        >
            {/* Pinterest Grid Layout: 2 columns on mobile, 4 on md+ */}
            <div className="columns-2 md:columns-4 gap-2 md:gap-4 space-y-2 md:space-y-4">
                {allImages.map((image, idx) => (
                    <div key={idx} className="break-inside-avoid mb-2 md:mb-4">
                        <ImageCard
                            src={image.url}
                            alt={`Gallery image ${idx + 1}`}
                            className="w-full"
                            isLoading={loadingStates[idx]}
                            onLoad={() => handleImageLoad(idx)}
                            onClick={() => handleImageClick(image.prompt, image.url)}
                        />
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

export default function PremiumGalleryLayout() {
    return (
        <div id="devil" className="min-h-screen bg-black">
            <div className="w-full px-2 md:px-4 lg:px-6 py-4 md:py-8">
                <div className="space-y-8 md:space-y-12">
                    <div >
                        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-br from-[#BC2120] via-[#9B111E] to-[#5C0A14] bg-clip-text text-transparent mb-4">
                            Devil
                        </h1>
                        <p className="text-gray-400 text-lg md:text-xl">
                            Unleash darkness with bloody red devil masterpieces
                        </p>
                    </div>
                    {imageCollections.map((collection, index) => (
                        <PinterestGallery
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