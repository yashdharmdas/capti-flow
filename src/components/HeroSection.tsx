import { Play, Upload, Wand2, Download, CheckCircle } from "lucide-react";

interface HeroSectionProps {
  onStartClick: () => void;
}

const HeroSection = ({ onStartClick }: HeroSectionProps) => {
  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-32 right-16 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-accent/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 animate-fade-in">
            <span className="gradient-text">CaptiFlow</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Transform your vertical videos with stunning AI-generated captions. 
            Perfect for social media, marketing, and accessibility.
          </p>
          
          <button 
            onClick={onStartClick}
            className="btn-hero animate-glow"
          >
            <Upload className="mr-2" size={20} />
            Start Creating
          </button>
        </div>

        {/* Demo Video Section */}
        <div className="max-w-md mx-auto mb-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="aspect-[9/16] bg-gradient-card rounded-2xl border border-border shadow-card overflow-hidden">
            <div className="h-full flex items-center justify-center bg-muted/20">
              <div className="text-center p-8">
                <Play size={48} className="text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Demo Video Preview</p>
                <p className="text-sm text-muted-foreground/70 mt-2">
                  9:16 aspect ratio with captions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Process Steps */}
        <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {[
            { icon: Upload, title: "Upload Video", desc: "Drop your 9:16 vertical video (max 60s)" },
            { icon: Wand2, title: "AI Magic", desc: "Automatic speech-to-text with perfect timing" },
            { icon: Play, title: "Style It", desc: "Choose from professional caption templates" },
            { icon: Download, title: "Download", desc: "Get your captioned video in high quality" }
          ].map((step, index) => (
            <div 
              key={index} 
              className="text-center animate-fade-in" 
              style={{ animationDelay: `${0.6 + index * 0.1}s` }}
            >
              <div className="bg-gradient-card border border-border rounded-xl p-6 mb-4 hover:border-primary/50 transition-colors">
                <step.icon size={32} className="text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { title: "95%+ Accuracy", desc: "Advanced AI speech recognition" },
            { title: "Professional Templates", desc: "10+ customizable caption styles" },
            { title: "Lightning Fast", desc: "Process videos in under 3 minutes" }
          ].map((feature, index) => (
            <div 
              key={index}
              className="text-center p-6 animate-fade-in"
              style={{ animationDelay: `${1.0 + index * 0.1}s` }}
            >
              <CheckCircle size={24} className="text-success mx-auto mb-3" />
              <h4 className="font-semibold mb-2">{feature.title}</h4>
              <p className="text-muted-foreground text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;