"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Mail } from "lucide-react";
import { BusinessCard } from "@/types/businessCard";
import { useToast } from "@/hooks/use-toast";
import {
  SignatureLayoutSelector,
  SignaturePreview,
  generateSignatureHTML,
  SignatureLayout,
} from "./email-signature";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
interface EmailSignatureSectionProps {
  card: BusinessCard;
}

export function EmailSignatureSection({ card }: EmailSignatureSectionProps) {
  const [selectedLayout, setSelectedLayout] =
    useState<SignatureLayout>("text-only");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const [gmailDialogOpen, setGmailDialogOpen] = useState(false);
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

          <SignaturePreview card={card} selectedLayout={selectedLayout} />
          <div className="flex gap-2">
            <Button
              onClick={copyToClipboard}
              className="flex-1"
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

            <Dialog open={gmailDialogOpen} onOpenChange={setGmailDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <Mail className="w-4 h-4 mr-2" />
                  Gmail Setup
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Gmail Signature Setup</DialogTitle>
                  <DialogDescription>
                    Follow these steps to add your signature to Gmail
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">
                      📋 Important: How Gmail Handles HTML
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Gmail accepts HTML signatures, but the best method is to
                      paste the <strong>rendered signature</strong> (not raw
                      HTML code) directly into Gmail&apos;s signature editor.
                      This preserves formatting better.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">
                      Step 1: Copy Your Signature HTML
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Click the "Copy HTML Signature" button above to copy your
                      signature code.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">
                      Step 2: Render the Signature First
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      1. Open a new browser tab and press F12 (or right-click →
                      Inspect)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      2. Go to the "Console" tab
                    </p>
                    <p className="text-sm text-muted-foreground">
                      3. Paste this code and press Enter:
                    </p>
                    <code className="block bg-muted p-2 rounded text-xs mt-1">
                      document.body.innerHTML = `YOUR_COPIED_HTML_HERE`
                    </code>
                    <p className="text-sm text-muted-foreground mt-2">
                      4. Select all the rendered signature content on the page
                      (Ctrl+A / Cmd+A) and copy it
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">
                      Step 3: Open Gmail Settings
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      1. Go to{" "}
                      <a
                        href="https://mail.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        Gmail
                      </a>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      2. Click the gear icon ⚙️ in the top right corner
                    </p>
                    <p className="text-sm text-muted-foreground">
                      3. Select "See all settings"
                    </p>
                    <p className="text-sm text-muted-foreground">
                      4. Make sure you&apos;re on the "General" tab
                    </p>
                    <p className="text-sm text-muted-foreground">
                      5. Scroll down to the "Signature" section
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">
                      Step 4: Create Your Signature
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      1. Click "+ Create new" to create a new signature
                    </p>
                    <p className="text-sm text-muted-foreground">
                      2. Give your signature a name (e.g., "Professional")
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">
                      Step 5: Paste the Rendered Signature
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      1. Click in the signature editor box
                    </p>
                    <p className="text-sm text-muted-foreground">
                      2. Paste the rendered signature you copied (Ctrl+V /
                      Cmd+V)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      3. Your signature with all formatting should appear
                      correctly
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">
                      Step 6: Set as Default (Optional)
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Below the signature editor, you can set this signature as
                      default for:
                    </p>
                    <p className="text-sm text-muted-foreground">
                      • "For new emails" - Automatically add to new emails
                    </p>
                    <p className="text-sm text-muted-foreground">
                      • "On reply/forward" - Add when replying or forwarding
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">
                      Step 7: Save Changes
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Scroll to the bottom of the settings page and click "Save
                      Changes"
                    </p>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg mt-4 border border-yellow-200 dark:border-yellow-800">
                    <h4 className="font-semibold text-sm mb-2 text-yellow-900 dark:text-yellow-100">
                      ⚡ Simpler Alternative Method
                    </h4>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                      If the method above seems complex, try this easier
                      approach:
                    </p>
                    <ol className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 list-decimal list-inside">
                      <li>Copy the HTML signature using the button above</li>
                      <li>Compose a new email in Gmail</li>
                      <li>
                        Paste the HTML into the email body (it will render
                        automatically)
                      </li>
                      <li>Select all the rendered content and copy it again</li>
                      <li>
                        Go to Gmail Settings → Signature and paste it there
                      </li>
                    </ol>
                  </div>

                  <div className="bg-muted p-4 rounded-lg mt-4">
                    <h4 className="font-semibold text-sm mb-2">
                      💡 Troubleshooting Tips
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>
                        If images don&apos;t appear, make sure they&apos;re
                        hosted online and publicly accessible
                      </li>
                      <li>
                        Gmail may strip some HTML styling for security - this is
                        normal
                      </li>
                      <li>
                        Always test your signature by sending yourself an email
                      </li>
                      <li>
                        For mobile: Gmail app → Menu → Settings → Select account
                        → Signature
                      </li>
                      <li>
                        If formatting looks wrong, try the alternative method
                        above
                      </li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
