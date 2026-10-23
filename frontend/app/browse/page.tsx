import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BrowsePage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-5 py-16 bg-brand-ivory/30">
      <div className="max-w-md w-full text-center space-y-5 p-8 rounded-3xl bg-white border border-border shadow-xs">
        <div className="w-16 h-16 mx-auto rounded-full bg-brand-coral/15 flex items-center justify-center text-brand-coral">
          <Compass className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-heading font-black tracking-tight text-brand-navy">
            Browse Experiences
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Curated London mingles, filterable by borough, date, and experience type. Full catalog experience coming in Part F3!
          </p>
        </div>
        <div className="pt-2">
          <Link href="/">
            <Button variant="coral" className="rounded-xl px-6">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
