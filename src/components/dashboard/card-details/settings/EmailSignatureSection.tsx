'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { BusinessCard } from '@/types/businessCard';
import { useToast } from '@/hooks/use-toast';
import { 
  SignatureLayoutSelector, 
  SignaturePreview, 
  generateSignatureHTML, 
  SignatureLayout 
} from './email-signature';

interface EmailSignatureSectionProps {
  card: BusinessCard;
}

export function EmailSignatureSection({ card }: EmailSignatureSectionProps) {
  const [selectedLayout, setSelectedLayout] = useState<SignatureLayout>('text-only');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      const html = generateSignatureHTML(card, selectedLayout);
      await navigator.clipboard.writeText(html);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Email signature HTML copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy signature to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Email Signature</h3>
          
          <SignatureLayoutSelector 
            selectedLayout={selectedLayout}
            onLayoutChange={setSelectedLayout}
          />

          <SignaturePreview 
            card={card}
            selectedLayout={selectedLayout}
          />

          <Button 
            onClick={copyToClipboard}
            className="w-full"
            variant="outline"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy HTML Signature
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
