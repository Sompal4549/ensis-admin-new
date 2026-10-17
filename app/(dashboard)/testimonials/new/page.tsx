import { redirect } from "next/navigation";

// Testimonials are added from the Testimonials screen ("Add" saves to the homepage section)
export default function NewTestimonialPage() {
  redirect("/testimonials");
}
