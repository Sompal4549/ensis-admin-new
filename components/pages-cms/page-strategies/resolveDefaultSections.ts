import type { CmsPage } from "@/lib/cmsPages";
import { defaultLandingSections } from "@/lib/landingContent";
import { defaultAboutSections } from "@/lib/aboutContent";
import { defaultAdvisorySections, defaultNominateAdvisorySections } from "@/lib/advisoryContent";
import { defaultBlogSections } from "@/lib/blogContent";
import { defaultParticipateAsExhibitorSections } from "@/lib/participateAsExhibitorContent";
import { defaultExhibitionCategoriesSections } from "@/lib/exhibitionCategoriesContent";
import {
  defaultBookAStandSections,
  defaultVisitorRegistrationSections,
  defaultDelegateRegistrationSections,
  defaultBuyerRegistrationSections,
  defaultTermsAndConditionsSections,
  defaultPrivacyPolicySections,
  defaultRefundPolicySections,
} from "@/lib/registrationPagesContent";
import { defaultWhyVisitSections } from "@/lib/whyVisitContent";
import { defaultWhyExhibitSections } from "@/lib/whyExhibitContent";
import {
  defaultMsmeSections,
  defaultMsmeEligibilityCheckSections,
  defaultMsmeApplySections,
  defaultMsmeParticipationDetailsSections,
  defaultMsmeApplyPaymentSections,
  defaultExhibitorLoginSections,
  defaultBuyerLoginSections,
  defaultDelegatesLoginSections,
  defaultUserLoginSections,
} from "@/lib/msmeContent";
import { defaultExhibitorsSections } from "@/lib/exhibitorsContent";
import { defaultBuyerSellerMeetSections } from "@/lib/buyerSellerMeetContent";
import { defaultGallerySections } from "@/lib/galleryContent";
import { defaultAwardsSections, defaultAwardsNominationSections } from "@/lib/awardsContent";
import { defaultContactSections } from "@/lib/contactContent";
import { defaultSponsorshipSections, defaultEPromotionSections, defaultPartnershipPageSections, defaultSubPartnershipSections } from "@/lib/opportunityContent";
import { defaultSupportServicesSections } from "@/lib/extraPagesContent";
import { defaultCareersSections } from "@/lib/careersContent";
import {
  defaultEnsisLandingSections,
  defaultEnsisAboutSections,
  defaultEnsisTurnkeySections,
  defaultEnsisConsultancySections,
  defaultEnsisProductsSections,
  defaultEnsisProjectsSections,
  defaultEnsisBlogSections,
  defaultEnsisCareersSections,
  defaultEnsisContactSections,
  defaultEnsisEnquirySections,
  defaultEnsisPolicySections,
  defaultEnsisTermsSections,
  defaultEnsisDisclaimerSections,
  defaultEnsisRefundSections,
} from "@/lib/ensisContent";
import type { SectionsDraft } from "./types";

/**
 * Maps a CMS page to its hardcoded fallback section template (one
 * per page type) used when the page's saved config has no sections
 * of its own yet, or as the base that saved data gets merged onto.
 */
export function resolveDefaultSectionsForPage(page: CmsPage): SectionsDraft {
  const key = (page.configKey || "").toLowerCase();
  const title = (page.title || "").toLowerCase();
  const slug = (page.slug || "").toLowerCase();

  // Ensis Page Mappings
  if (key === "landingpage" || slug === "/" || (title.includes("home") && !title.includes("stay"))) return defaultEnsisLandingSections;
  if (key === "aboutpage" || slug === "/about-us" || (title.includes("about") && !title.includes("expo"))) return defaultEnsisAboutSections;
  if (key === "turnkeypage" || slug.includes("turnkey") || title.includes("turnkey")) return defaultEnsisTurnkeySections;
  if (key === "consultancypage" || slug.includes("consultancy") || title.includes("consultancy")) return defaultEnsisConsultancySections;
  if (key === "solutionspage" || slug.includes("solutions") || title.includes("solutions")) return defaultEnsisTurnkeySections;
  if (key === "productspage" || slug.includes("product") || title.includes("product")) return defaultEnsisProductsSections;
  if (key === "projectspage" || slug.includes("project") || title.includes("project") || title.includes("client")) return defaultEnsisProjectsSections;
  if (key === "blogpage" || slug.includes("blog") || title.includes("blog")) return defaultEnsisBlogSections;
  if (key === "careerspage" || slug.includes("career") || title.includes("career")) return defaultEnsisCareersSections;
  if (key === "contactpage" || slug.includes("contact") || title.includes("contact")) return defaultEnsisContactSections;
  if (key === "enquirypage" || slug.includes("enquiry") || title.includes("enquiry")) return defaultEnsisEnquirySections;
  if (key === "privacypolicypage" || slug.includes("privacy") || title.includes("privacy")) return defaultEnsisPolicySections;
  if (key === "termsandconditionspage" || slug.includes("terms") || title.includes("terms")) return defaultEnsisTermsSections;
  if (key === "disclaimerpage" || slug.includes("disclaimer") || title.includes("disclaimer")) return defaultEnsisDisclaimerSections;
  if (key === "refundpolicypage" || slug.includes("refund") || title.includes("refund")) return defaultEnsisRefundSections;

  // Fallbacks for Ensis pages if accessed
  if (key === "careerspage" || slug === "/careers") return defaultCareersSections;
  if (key === "msmeeligibilitycheckpage" || slug.includes("eligibility-check")) return defaultMsmeEligibilityCheckSections;
  if (key === "msmeapplypaymentpage" || slug.includes("participate/msme/apply/payment")) return defaultMsmeApplyPaymentSections;
  if (key === "msmeapplyparticipationdetailspage" || slug.includes("participation-details")) return defaultMsmeParticipationDetailsSections;
  if (key === "msmeapplypage" || (slug.includes("participate/msme/apply") && !slug.includes("participation-details") && !slug.includes("payment"))) return defaultMsmeApplySections;
  if (key.includes("partnerpage") || (slug.includes("partnership/") && slug !== "/partnership")) return defaultSubPartnershipSections;
  if (key === "awardsnominationpage" || slug.includes("awards/nominations") || (slug.includes("nomination") && !slug.includes("advisory")) || (title.includes("nomination") && !title.includes("advisory"))) return defaultAwardsNominationSections;
  if (key === "nominateadvisorypage" || slug.includes("nominate_advisory_board")) return defaultNominateAdvisorySections;
  if (key === "supportservicespage" || slug.includes("suport_services")) return defaultSupportServicesSections;
  if (key === "aboutpage" || title.includes("about") || slug === "/about") return defaultAboutSections;
  if (key === "advisorypage" || title.includes("advisory") || slug.includes("advisory")) return defaultAdvisorySections;
  if (key === "blogpage" || title.includes("blog") || slug.includes("blog")) return defaultBlogSections;
  if (key === "participateasexhibitorpage" || title.includes("participate as exhibitor") || slug.includes("participate-as-exhibitor")) return defaultParticipateAsExhibitorSections;
  if (key === "exhibitioncategoriespage" || title.includes("exhibition categories") || slug.includes("exhibition-categories")) return defaultExhibitionCategoriesSections;
  if (key === "bookastandpage" || title.includes("book a stall") || title.includes("book a stand") || slug.includes("book-a-stand")) return defaultBookAStandSections;
  if (key === "visitorregistrationpage" || title.includes("register as visitor") || title.includes("visitor registration") || slug.includes("visitor-registration")) return defaultVisitorRegistrationSections;
  if (key === "delegateregistrationpage" || title.includes("delegate registration") || slug.includes("delegate-registration")) return defaultDelegateRegistrationSections;
  if (key === "buyerregistrationpage" || title.includes("register as buyer") || title.includes("buyer registration") || slug.includes("buyer-registration")) return defaultBuyerRegistrationSections;
  if (key === "termsandconditionspage" || title.includes("terms") || slug.includes("terms")) return defaultTermsAndConditionsSections;
  if (key === "privacypolicypage" || title.includes("privacy") || slug.includes("privacy")) return defaultPrivacyPolicySections;
  if (key === "refundpolicypage" || title.includes("refund") || slug.includes("refund")) return defaultRefundPolicySections;
  if (key === "whyvisitpage" || title.includes("why visit") || slug.includes("why-visit")) return defaultWhyVisitSections;
  if (key === "whyexhibitpage" || title.includes("why exhibit") || slug.includes("why-exhibit")) return defaultWhyExhibitSections;
  if (key === "msmepage" || title.includes("msme") || slug.includes("msme")) return defaultMsmeSections;
  if (key === "exhibitorspage" || title.includes("exhibitors") || slug.includes("exhibitors")) return defaultExhibitorsSections;
  if (key === "buyersellermeetpage" || title.includes("buyer-seller") || slug.includes("buyer-seller")) return defaultBuyerSellerMeetSections;
  if (key === "gallerypage" || title.includes("gallery") || slug.includes("gallery")) return defaultGallerySections;
  if (key === "awardspage" || title.includes("award") || slug.includes("awards")) return defaultAwardsSections;
  if (key === "sponsorshippage" || title.includes("sponsorship") || slug.includes("sponsorship")) return defaultSponsorshipSections;
  if (key === "epromotionpage" || title.includes("e-promotion") || slug.includes("e-promotion")) return defaultEPromotionSections;
  if (key === "partnershippage" || title.includes("partnership") || slug.includes("partnership")) return defaultPartnershipPageSections;
  if (key === "exhibitorloginpage" || title.includes("exhibitor login") || slug.includes("exhibitor-login")) return defaultExhibitorLoginSections;
  if (key === "buyerloginpage" || title.includes("buyer login") || slug.includes("buyer-login")) return defaultBuyerLoginSections;
  if (key === "delegatesloginpage" || title.includes("delegates login") || slug.includes("delegates-login")) return defaultDelegatesLoginSections;
  if (key === "userloginpage" || title.includes("user login") || slug.includes("/login")) return defaultUserLoginSections;
  if (key === "contactpage" || title.includes("contact") || title.includes("advisor") || slug.includes("contact")) return defaultContactSections;
  return defaultEnsisLandingSections;
}

/**
 * Same page -> template mapping used by the "Sync / Reset Website
 * Data" button.
 */
export function resolveResetDefaultsForPage(page: CmsPage): SectionsDraft {
  const key = (page.configKey || "").toLowerCase();
  const title = (page.title || "").toLowerCase();
  const slug = (page.slug || "").toLowerCase();

  // Ensis Page Mappings
  if (key === "landingpage" || slug === "/" || (title.includes("home") && !title.includes("stay"))) return defaultEnsisLandingSections;
  if (key === "aboutpage" || slug === "/about-us" || (title.includes("about") && !title.includes("expo"))) return defaultEnsisAboutSections;
  if (key === "turnkeypage" || slug.includes("turnkey") || title.includes("turnkey")) return defaultEnsisTurnkeySections;
  if (key === "consultancypage" || slug.includes("consultancy") || title.includes("consultancy")) return defaultEnsisConsultancySections;
  if (key === "solutionspage" || slug.includes("solutions") || title.includes("solutions")) return defaultEnsisTurnkeySections;
  if (key === "productspage" || slug.includes("product") || title.includes("product")) return defaultEnsisProductsSections;
  if (key === "projectspage" || slug.includes("project") || title.includes("project") || title.includes("client")) return defaultEnsisProjectsSections;
  if (key === "blogpage" || slug.includes("blog") || title.includes("blog")) return defaultEnsisBlogSections;
  if (key === "careerspage" || slug.includes("career") || title.includes("career")) return defaultEnsisCareersSections;
  if (key === "contactpage" || slug.includes("contact") || title.includes("contact")) return defaultEnsisContactSections;
  if (key === "enquirypage" || slug.includes("enquiry") || title.includes("enquiry")) return defaultEnsisEnquirySections;
  if (key === "privacypolicypage" || slug.includes("privacy") || title.includes("privacy")) return defaultEnsisPolicySections;
  if (key === "termsandconditionspage" || slug.includes("terms") || title.includes("terms")) return defaultEnsisTermsSections;
  if (key === "disclaimerpage" || slug.includes("disclaimer") || title.includes("disclaimer")) return defaultEnsisDisclaimerSections;
  if (key === "refundpolicypage" || slug.includes("refund") || title.includes("refund")) return defaultEnsisRefundSections;

  let defaults = defaultEnsisLandingSections;
  if (key === "careerspage" || slug === "/careers") defaults = defaultCareersSections;
  else if (key === "msmeeligibilitycheckpage" || slug.includes("eligibility-check")) defaults = defaultMsmeEligibilityCheckSections;
  else if (key === "msmeapplypaymentpage" || slug.includes("participate/msme/apply/payment")) defaults = defaultMsmeApplyPaymentSections;
  else if (key === "msmeapplyparticipationdetailspage" || slug.includes("participation-details")) defaults = defaultMsmeParticipationDetailsSections;
  else if (key === "msmeapplypage" || (slug.includes("participate/msme/apply") && !slug.includes("participation-details") && !slug.includes("payment"))) defaults = defaultMsmeApplySections;
  else if (key.includes("partnerpage") || (slug.includes("partnership/") && slug !== "/partnership")) defaults = defaultSubPartnershipSections;
  else if (key === "awardsnominationpage" || slug.includes("awards/nominations")) defaults = defaultAwardsNominationSections;
  else if (key === "nominateadvisorypage" || slug.includes("nominate_advisory_board")) defaults = defaultNominateAdvisorySections;
  else if (key === "supportservicespage" || slug.includes("suport_services")) defaults = defaultSupportServicesSections;
  else if (key === "aboutpage" || title.includes("about") || slug === "/about") defaults = defaultAboutSections;
  else if (key === "advisorypage" || title.includes("advisory") || slug.includes("advisory")) defaults = defaultAdvisorySections;
  else if (key === "blogpage" || title.includes("blog") || slug.includes("blog")) defaults = defaultBlogSections;
  else if (key === "participateasexhibitorpage" || title.includes("participate as exhibitor") || slug.includes("participate-as-exhibitor")) defaults = defaultParticipateAsExhibitorSections;
  else if (key === "exhibitioncategoriespage" || title.includes("exhibition categories") || slug.includes("exhibition-categories")) defaults = defaultExhibitionCategoriesSections;
  else if (key === "bookastandpage" || title.includes("book a stall") || title.includes("book a stand") || slug.includes("book-a-stand")) defaults = defaultBookAStandSections;
  else if (key === "visitorregistrationpage" || title.includes("register as visitor") || title.includes("visitor registration") || slug.includes("visitor-registration")) defaults = defaultVisitorRegistrationSections;
  else if (key === "delegateregistrationpage" || title.includes("delegate registration") || slug.includes("delegate-registration")) defaults = defaultDelegateRegistrationSections;
  else if (key === "buyerregistrationpage" || title.includes("register as buyer") || title.includes("buyer registration") || slug.includes("buyer-registration")) defaults = defaultBuyerRegistrationSections;
  else if (key === "termsandconditionspage" || title.includes("terms") || slug.includes("terms")) defaults = defaultTermsAndConditionsSections;
  else if (key === "privacypolicypage" || title.includes("privacy") || slug.includes("privacy")) defaults = defaultPrivacyPolicySections;
  else if (key === "refundpolicypage" || title.includes("refund") || slug.includes("refund")) defaults = defaultRefundPolicySections;
  else if (key === "whyvisitpage" || title.includes("why visit") || slug.includes("why-visit")) defaults = defaultWhyVisitSections;
  else if (key === "whyexhibitpage" || title.includes("why exhibit") || slug.includes("why-exhibit")) defaults = defaultWhyExhibitSections;
  else if (key === "msmepage" || title.includes("msme") || slug.includes("msme")) defaults = defaultMsmeSections;
  else if (key === "exhibitorspage" || title.includes("exhibitors") || slug.includes("exhibitors")) defaults = defaultExhibitorsSections;
  else if (key === "buyersellermeetpage" || title.includes("buyer-seller") || slug.includes("buyer-seller")) defaults = defaultBuyerSellerMeetSections;
  else if (key === "gallerypage" || title.includes("gallery") || slug.includes("gallery")) defaults = defaultGallerySections;
  else if (key === "awardspage" || title.includes("award") || slug.includes("awards")) defaults = defaultAwardsSections;
  else if (key === "sponsorshippage" || title.includes("sponsorship") || slug.includes("sponsorship")) defaults = defaultSponsorshipSections;
  else if (key === "epromotionpage" || title.includes("e-promotion") || slug.includes("e-promotion")) defaults = defaultEPromotionSections;
  else if (key === "partnershippage" || title.includes("partnership") || slug.includes("partnership")) defaults = defaultPartnershipPageSections;
  else if (key === "exhibitorloginpage" || title.includes("exhibitor login") || slug.includes("exhibitor-login")) defaults = defaultExhibitorLoginSections;
  else if (key === "buyerloginpage" || title.includes("buyer login") || slug.includes("buyer-login")) defaults = defaultBuyerLoginSections;
  else if (key === "delegatesloginpage" || title.includes("delegates login") || slug.includes("delegates-login")) defaults = defaultDelegatesLoginSections;
  else if (key === "userloginpage" || title.includes("user login") || slug.includes("/login")) defaults = defaultUserLoginSections;
  else if (key === "contactpage" || title.includes("contact") || title.includes("advisor") || slug.includes("contact")) defaults = defaultContactSections;

  return defaults;
}
