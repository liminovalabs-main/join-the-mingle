import { Metadata } from "next";
import { VenueRegistrationForm } from "@/components/venue/venue-registration-form";

export const metadata: Metadata = {
  title: "Partner With Us | Register Venue | Mingler",
  description: "Apply to become a verified Mingler venue partner in London and host curated social experiences.",
};

export default function VenueRegisterPage() {
  return (
    <main className="min-h-screen bg-brand-ivory py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <VenueRegistrationForm />
      </div>
    </main>
  );
}
