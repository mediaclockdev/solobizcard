"use client";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoDisplaySectionProps {
  title?: string;
  subtitle?: string;
  videoUrl?: string;
  onPlayClick?: () => void;
}

export function VideoDisplaySection({ 
  title = "See SoloCards in Action", 
  subtitle = "Watch how entrepreneurs use SoloCards to grow their business",
  videoUrl,
  onPlayClick 
}: VideoDisplaySectionProps) {
  const handlePlayClick = () => {
    if (onPlayClick) {
      onPlayClick();
    } else if (videoUrl) {
      window.open(videoUrl, '_blank');
    }
  };

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="relative w-full h-[50vh] min-h-[400px] overflow-hidden rounded-2xl shadow-2xl">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('/lovable-uploads/a571395d-f395-4c27-b654-7b884a248e59.png')`
            }}
          />
          
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20" />
          
          {/* Content Container */}
          <div className="relative h-full flex items-center justify-center">
            {/* Play Button */}
            <Button
              size="lg"
              variant="ghost"
              onClick={handlePlayClick}
              className="group relative bg-white/20 hover:bg-white/30 border-2 border-white/40 hover:border-white/60 backdrop-blur-sm transition-all duration-300 rounded-full w-28 h-28 p-0"
            >
              <Play className="w-12 h-12 text-white fill-white ml-1 group-hover:scale-110 transition-transform duration-300" />
            </Button>
            
            {/* Title and Subtitle - Bottom Left */}
            <div className="absolute bottom-6 left-6 max-w-lg">
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                  {title}
                </h2>
                <p className="text-sm md:text-base text-white/90 leading-relaxed">
                  {subtitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}