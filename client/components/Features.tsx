import React from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const Features = () => {
  const [currentStep, setCurrentStep] = React.useState(0);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 30 });

  const steps = [
    { 
      title: "Pick Your Persona", 
      subtitle: "Choose your trained AI face model" 
    },
    { 
      title: "Share Your Idea", 
      subtitle: "Describe the scene in simple prompt" 
    },
    { 
      title: "See It Come Alive", 
      subtitle: "Get 100% accurate, realistic images instantly" 
    }
  ];
  

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          className="absolute w-96 h-96 rounded-full bg-[#B08D57]/10 blur-3xl"
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: '20%', left: '10%' }}
        />
        <motion.div 
          className="absolute w-64 h-64 rounded-full bg-[#B08D57]/5 blur-2xl"
          animate={{ 
            x: [0, -80, 0],
            y: [0, 30, 0] 
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{ bottom: '30%', right: '15%' }}
        />
      </div>

      <div className="container mx-auto px-6 py-20 relative z-10">
        {/* Header */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <motion.h1 
            className="text-6xl md:text-8xl font-thin mb-6 tracking-tight"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
          >
            Create Like
            <motion.span 
              className="text-[#B08D57] block"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
            >
              A Pro
            </motion.span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-400 max-w-2xl mx-auto font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
          >
            Train Your Perosna too create 100% accurate content
          </motion.p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          
          {/* Left: Interactive Demo */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            {/* Process Steps */}
            <div className="mb-12">
              {steps.map((step, idx) => (
                <motion.div
                  key={idx}
                  className={`flex items-center gap-4 mb-6 p-4 rounded-2xl transition-all duration-500 ${
                    idx === currentStep 
                      ? 'bg-[#B08D57]/20 border border-[#B08D57]/30' 
                      : 'bg-gray-900/30 border border-gray-800'
                  }`}
                  animate={{ 
                    scale: idx === currentStep ? 1.02 : 1,
                    opacity: idx === currentStep ? 1 : 0.6
                  }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    idx === currentStep ? 'bg-[#B08D57] text-black' : 'bg-gray-700 text-gray-300'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-medium">{step.title}</div>
                    <div className="text-sm text-gray-400">{step.subtitle}</div>
                  </div>
                  
                </motion.div>
              ))}
            </div>

            {/* CTA Button */}
            <motion.button
              className="group relative bg-[#B08D57] text-black px-8 py-4 rounded-full font-medium text-lg overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseMove={handleMouseMove}
            >
              <motion.div
                className="absolute inset-0 bg-white/20"
                style={{
                  x: springX,
                  y: springY,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  filter: 'blur(20px)',
                }}
              />
             <Link href='/admin/personas'><span className="relative z-10 flex items-center gap-2">
                Start Creating
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span></Link> 
            </motion.button>
          </motion.div>

          {/* Right: Lisa Persona Showcase */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <div className="relative mx-auto max-w-sm">
              
              {/* Persona Card */}
              <motion.div
                className="relative bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 border border-gray-800"
                animate={{ 
                  rotateY: [0, 5, 0, -5, 0],
                  rotateX: [0, 2, 0, -2, 0] 
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-[#B08D57]/10 rounded-3xl blur-xl" />
                
                {/* Header */}
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 rounded-full bg-[#B08D57]" />
                    <span className="text-sm text-gray-400 font-medium tracking-wider">LISA PERSONA</span>
                  </div>

                  {/* Profile Image */}
                  <motion.div 
                    className="relative w-32 h-32 mx-auto mb-6"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#B08D57] to-[#B08D57]/50 rounded-full p-1">
                      <div className="w-full h-full rounded-full overflow-hidden bg-gray-900">
                        <img
                          src="/persona/LisaPersona.png"
                          alt="Lisa AI Persona"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    
                    {/* Pulse Animation */}
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-[#B08D57]"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>

                  {/* Info */}
                  <div className="text-center">
                    <h3 className="text-2xl font-light mb-2">Lisa</h3>
                    
                    {/* Stats */}
                    <div className="flex justify-center gap-6 mt-6 pt-6 border-t border-gray-800">
                      <div className="text-center">
                        <div className="text-[#B08D57] font-medium">98%</div>
                        <div className="text-xs text-gray-500">Accuracy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[#B08D57] font-medium">5.2s</div>
                        <div className="text-xs text-gray-500">Generate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[#B08D57] font-medium">1M+</div>
                        <div className="text-xs text-gray-500">Posts</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Generated Content Preview */}
              <motion.div 
                className="absolute -right-12 -bottom-12 w-48 h-64 bg-gray-900 rounded-2xl overflow-hidden border border-gray-800"
                initial={{ opacity: 0, scale: 0.8, rotate: 15 }}
                animate={{ opacity: 1, scale: 1, rotate: 12 }}
                transition={{ delay: 1.5, duration: 1 }}
                whileHover={{ rotate: 0, scale: 1.05 }}
              >
                <img
                  src="/persona/LisaPost.png"
                  alt="Generated content"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

              </motion.div>

              
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default Features;