"use client";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function TrackingCodeSection() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Add Tracking Code</h3>
          <Button variant="outline" size="sm">
            Add New
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}