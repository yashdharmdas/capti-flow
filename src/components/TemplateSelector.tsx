import { useState } from "react";
import { CheckCircle } from "lucide-react";

interface TemplateSelectorProps {
  onSelect: (templateId: string) => void;
  selectedTemplate: string;
}

const templates = [
  {
    id: 'minimal',
    name: 'Minimal Clean',
    description: 'Simple white text with subtle shadow',
    preview: 'caption-minimal',
    color: 'from-gray-100 to-gray-200'
  },
  {
    id: 'bold',
    name: 'Bold Impact',
    description: 'Large, bold text with strong shadow',
    preview: 'caption-bold',
    color: 'from-slate-800 to-slate-900'
  },
  {
    id: 'gradient',
    name: 'Modern Gradient',
    description: 'Colorful gradient text with glow effect',
    preview: 'caption-gradient',
    color: 'from-primary to-secondary'
  },
  {
    id: 'neon',
    name: 'Tech Neon',
    description: 'Futuristic neon glow styling',
    preview: 'caption-neon',
    color: 'from-accent to-accent'
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Professional blue styling',
    preview: 'caption-minimal',
    color: 'from-blue-600 to-blue-800'
  },
  {
    id: 'social',
    name: 'Social Media',
    description: 'Instagram/TikTok style with background',
    preview: 'caption-bold',
    color: 'from-pink-500 to-purple-600'
  }
];

const TemplateSelector = ({ onSelect, selectedTemplate }: TemplateSelectorProps) => {
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  return (
    <div className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Choose Your Caption Style</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Select a professional template that matches your brand and content style. 
          Each template is optimized for readability and visual impact.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
            onMouseEnter={() => setHoveredTemplate(template.id)}
            onMouseLeave={() => setHoveredTemplate(null)}
            onClick={() => onSelect(template.id)}
          >
            {/* Template Preview */}
            <div className="aspect-[9/16] bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden mb-4 relative">
              <div className="absolute inset-0 bg-black/20"></div>
              
              {/* Mock video content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[6px] border-r-0 border-b-[4px] border-t-[4px] border-transparent border-l-white/60 ml-1"></div>
                </div>
              </div>
              
              {/* Caption Preview */}
              <div className="absolute bottom-4 left-4 right-4 text-center">
                <p className={template.preview}>
                  Perfect for social media
                </p>
              </div>
              
              {/* Selection Indicator */}
              {selectedTemplate === template.id && (
                <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-1">
                  <CheckCircle size={16} />
                </div>
              )}
            </div>

            {/* Template Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{template.name}</h3>
                <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${template.color}`}></div>
              </div>
              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>
            </div>

            {/* Hover Effects */}
            {hoveredTemplate === template.id && (
              <div className="absolute inset-0 bg-primary/5 rounded-xl pointer-events-none"></div>
            )}
          </div>
        ))}
      </div>

      {/* Customization Preview */}
      <div className="mt-12 max-w-md mx-auto">
        <div className="bg-card/50 rounded-lg border border-border p-6">
          <h4 className="font-semibold mb-3">Template Features</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Font customization</span>
              <span className="text-primary">✓</span>
            </div>
            <div className="flex justify-between">
              <span>Color adjustments</span>
              <span className="text-primary">✓</span>
            </div>
            <div className="flex justify-between">
              <span>Position control</span>
              <span className="text-primary">✓</span>
            </div>
            <div className="flex justify-between">
              <span>Animation effects</span>
              <span className="text-primary">✓</span>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="text-center mt-8">
        <button 
          className="btn-hero"
          onClick={() => onSelect(selectedTemplate)}
        >
          Continue to Preview
        </button>
      </div>
    </div>
  );
};

export default TemplateSelector;