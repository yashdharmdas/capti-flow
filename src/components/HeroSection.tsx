import { Play, Upload, CheckCircle, ArrowRight, Users, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onStartClick: () => void;
}

const HeroSection = ({ onStartClick }: HeroSectionProps) => {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pt-16 pb-20">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" />
        
        <div className="relative container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 bg-white shadow-sm border rounded-full px-4 py-2 mb-8">
              <CheckCircle size={16} className="text-success" />
              <span className="text-sm font-medium text-foreground">Trusted by 10,000+ Content Creators</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground leading-tight">
              AI Captions: Captivating,{" "}
              <span className="text-primary">Engaging, and Effortless</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform your vertical videos with stunning AI-generated captions in minutes. 
              Perfect for social media, marketing, and accessibility with 95%+ accuracy.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                onClick={onStartClick}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Upload className="mr-2" size={20} />
                Generate Captions Now
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="border-2 border-primary/20 text-primary hover:bg-primary/5 px-8 py-4 text-lg font-semibold rounded-xl"
              >
                <Play className="mr-2" size={20} />
                Watch Demo
              </Button>
            </div>

            {/* Feature Highlights */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground mb-16">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-success" />
                <span>95%+ Accuracy</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-success" />
                <span>3-Minute Processing</span>
              </div>
              <div className="flex items-center gap-2">
                <Star size={16} className="text-success" />
                <span>Professional Templates</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={16} className="text-success" />
                <span>1080p HD Output</span>
              </div>
            </div>

            {/* Demo Video */}
            <div className="max-w-md mx-auto">
              <div className="aspect-[9/16] bg-gradient-to-br from-card via-white to-muted rounded-2xl shadow-xl border border-border/50 overflow-hidden">
                <div className="h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Play size={24} className="text-primary ml-1" />
                    </div>
                    <p className="text-foreground font-semibold mb-2">Demo Video Preview</p>
                    <p className="text-sm text-muted-foreground">
                      9:16 aspect ratio with AI captions
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 bg-gradient-to-r from-muted to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-foreground">
              Stop Spending Hours on Manual Captioning
            </h2>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Problems */}
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-foreground mb-6">The Old Way is Broken</h3>
                {[
                  "Manual captioning takes forever",
                  "Expensive caption services",
                  "Poor accuracy and timing",
                  "Limited styling options"
                ].map((problem, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-red-100">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                    </div>
                    <span className="text-foreground font-medium">{problem}</span>
                  </div>
                ))}
              </div>

              {/* Solutions */}
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-foreground mb-6">The CaptionFlow Way</h3>
                {[
                  "AI-powered caption generation",
                  "Professional templates included", 
                  "Perfect timing synchronization",
                  "Download in minutes, not hours"
                ].map((solution, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-primary/10">
                    <CheckCircle size={24} className="text-primary flex-shrink-0" />
                    <span className="text-foreground font-medium">{solution}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Why Content Creators Choose CaptionFlow
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to create professional captioned videos that drive engagement
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: "🎯",
                title: "95%+ Transcription Accuracy",
                description: "Advanced AI ensures your captions are precise and professional"
              },
              {
                icon: "⚡",
                title: "Lightning Fast Processing",
                description: "From upload to download in under 3 minutes"
              },
              {
                icon: "🎨",
                title: "Professional Styling",
                description: "Choose from 10+ caption templates designed for engagement"
              },
              {
                icon: "🔥",
                title: "HD Video Output",
                description: "Maintain perfect video quality with embedded captions"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-border/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20 bg-gradient-to-br from-muted to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              See CaptionFlow in Action
            </h2>
            <p className="text-xl text-muted-foreground">
              Upload → Generate → Style → Download
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              { number: "01", title: "Upload Video", desc: "Drop your 9:16 vertical video (max 60s)", icon: Upload },
              { number: "02", title: "AI Processing", desc: "Automatic speech-to-text with perfect timing", icon: CheckCircle },
              { number: "03", title: "Choose Style", desc: "Select from professional caption templates", icon: Play },
              { number: "04", title: "Download", desc: "Get your captioned video in high quality", icon: ArrowRight }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-border/50 mb-4 hover:shadow-xl transition-all duration-300">
                  <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                    {step.number}
                  </div>
                  <step.icon size={32} className="text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2 text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
                {index < 3 && (
                  <ArrowRight className="hidden md:block text-muted-foreground mx-auto" size={20} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary-glow text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Start Creating Professional Captions Today
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of content creators who trust CaptionFlow for their video captioning needs
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={onStartClick}
              size="lg"
              className="bg-white text-primary hover:bg-gray-50 px-8 py-4 text-lg font-semibold rounded-xl"
            >
              <Upload className="mr-2" size={20} />
              Generate Your First Captions
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="border-2 border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-xl"
            >
              <Play className="mr-2" size={20} />
              See Example Videos
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HeroSection;