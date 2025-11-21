"use client";

import React, { useState, useEffect } from "react";
import { Plus, X , Info} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";


interface Persona {
  _id: string;
  name: string;
  url: string;
  created_at: string;
}

const PersonaPage = () => {
  const { user } = useUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [personaName, setPersonaName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const router = useRouter();


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleSubmit = async () => {
    if (!personaName || !selectedFile) {
      toast.error("Please provide a name and select a video", {
            style: {
              background: "linear-gradient(to bottom right, #1E3A8A, #3B82F6, #1E40AF)",
              color: "white",
              border: "0px"
            }
          });
      return;
    }


    try {
            const formData = new FormData()
            formData.append('email', email)
            formData.append('name', personaName)
            formData.append('video', selectedFile)

            const res = await fetch('https://cravio-ai.onrender.com/api/persona', {
                method: 'POST',
                body: formData,
            })

            await res.json()

            if (res.status === 403) {
    toast.error('Paid feature. Subscribe to continue.', {
        style: {
            background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
            color: "white",
            border: "0px"
        }
    });
    router.push('/admin/pricing');
} else if (res.status === 400) {
    toast.error('Maximum 5 personas allowed per user', {
        style: {
            background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
            color: "white",
            border: "0px"
        }
    });
} else {
    toast.success('Video uploaded successfully', {
        style: {
            background: "linear-gradient(to bottom right, #4e3c20, #B08D57, #4e3c20)",
            color: "black",
            border: "0px"
        }
    });
}

        } catch (error) {
            toast.error("Failed to upload video", {
                style: {
                    background: "linear-gradient(to bottom right, #1E3A8A, #3B82F6, #1E40AF)",
                    color: "white",
                    border: "0px"
                }
            })
            console.error("Error:", error)
        } finally {
    setShowModal(false);
    setPersonaName("");
    setSelectedFile(null);
        }
    };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!email) return;

      try {
        const res = await fetch(`https://cravio-ai.onrender.com/user/${email}`);
        const data = await res.json();

        if (res.ok) {
          const personasData = data.personas;
          if (personasData && personasData.length > 0) setPersonas(personasData);
        } else {
          toast.error("Failed to load user data", {
            style: {
              background: "linear-gradient(to bottom right, #1E3A8A, #3B82F6, #1E40AF)",
              color: "white",
              border: "0px"
            }
          });
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load user data", {
            style: {
              background: "linear-gradient(to bottom right, #1E3A8A, #3B82F6, #1E40AF)",
              color: "white",
              border: "0px"
            }
          });
      }
    };

    fetchUserData();
  }, [email]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col px-4 pt-8 relative">
      {/* Header */}
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-3xl sm:text-4xl font-light tracking-tight mb-4 text-center"
      >
        Your <span className="font-semibold">Personas</span>
      </motion.h1>

      {/* Persona Grid */}
      {personas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl mx-auto pb-20">
          {personas.map((persona) => (
            <div
              key={persona._id}
              className="cursor-pointer group"
              onClick={() => setSelectedVideo(persona.url)}
            >
              <div className="relative w-full aspect-video overflow-hidden rounded-xl bg-black">
                <video
                  src={persona.url}
                  className="w-full h-full object-cover transition-transform duration-300"
                  muted
                  playsInline
                />
              </div>
              <p className="mt-2 text-sm sm:text-base font-medium truncate">
                {persona.name}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Floating Add Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 bg-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform"
      >
        <Plus className="w-6 h-6 text-black" />
      </motion.button>

      {/* Add Persona Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 rounded-2xl p-6 w-full max-w-md relative"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-3 right-3 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-semibold mb-4">Add New Persona</h2>

              <input
                type="text"
                placeholder="Enter persona name"
                value={personaName}
                onChange={(e) => setPersonaName(e.target.value)}
                className="w-full bg-zinc-800 text-white rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-zinc-600"
              />

            <div className="flex items-center gap-2">
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        className=" text-zinc-400 hover:text-white"
      >
        <Info className="w-5 h-5" />
      </button>
    </TooltipTrigger>
    <TooltipContent side="top" className="bg-zinc-800 text-white">
      Upload a 3–5 minute video
    </TooltipContent>
  </Tooltip>

              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="w-full text-sm text-zinc-400 mb-4 underline"
              />
            
            </div>
              

              {selectedFile && (
                <p className="text-xs text-zinc-500 truncate mb-2">
                  {selectedFile.name}
                </p>
              )}

              <button
                onClick={handleSubmit}
                className="w-full bg-white text-black font-semibold py-2 rounded-lg hover:opacity-90 transition"
              >
                Upload
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          >
            <div className="relative w-full max-w-4xl aspect-video rounded-xl overflow-hidden">
              <video
                src={selectedVideo}
                className="w-full h-full object-contain"
                autoPlay
                controls
              />
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 p-2 rounded-full"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PersonaPage;
