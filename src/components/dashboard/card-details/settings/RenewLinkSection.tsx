"use client";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RenewLinkSectionProps {
  cardId: string;
}

export function RenewLinkSection({ cardId }: RenewLinkSectionProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Renew Link</h3>
          <div className="space-y-3">
            <div className="p-3 bg-muted/20 rounded-md border">
              <p className="text-sm text-muted-foreground mb-1">Current Link:</p>
              <p className="text-sm font-mono break-all">
                https://digipromoting.com/card/{cardId}
              </p>
            </div>
            <Button variant="outline" size="sm">
              Renew Link
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}