import { BusinessCard } from "@/types/businessCard";
import { SignatureLayout } from "./types";

export function generateSignatureHTML(
  card: BusinessCard,
  layout: SignatureLayout
): string {
  const { profile, business, social } = card;
  const brandColor = card.brandColor || "#000000";

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const location = `${business.address.city}, ${business.address.state}`;
  const titleDept = `${profile.title}${
    profile.department ? ` - ${profile.department}` : ""
  }`;

  function svgToBase64(svg: string) {
    return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
  }

  const facebookSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${brandColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-facebook w-4 h-4"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>`;

  const twitterSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${brandColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-twitter w-4 h-4"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>`;

  const linkedinSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${brandColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-linkedin w-4 h-4"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>`;

  const instagramSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${brandColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-instagram w-4 h-4"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>`;

  const youtubeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${brandColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-youtube w-4 h-4" style="color: rgb(175, 82, 222);"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path><path d="m10 15 5-3-5-3z"></path></svg>`;

  const tiktokSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
  viewBox="0 0 24 24" fill="none" stroke="${brandColor}"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12.4 2h3.1c.2 1.2.8 2.3 1.7 3.2c.9.9 2 1.5 3.2 1.7v3.1
      c-1.7-.1-3.4-.7-4.8-1.7v7.3c0 3.6-2.9 6.4-6.4 6.4S3.8 19.2 3.8 15.6
      c0-3.5 2.9-6.4 6.4-6.4c.4 0 .7 0 1 .1v3.3c-.3-.1-.6-.1-1-.1
      c-1.7 0-3.1 1.4-3.1 3.1s1.4 3.2 3.1 3.2s3.1-1.4 3.1-3.1V2z"/>
</svg>`;

  // Social links array
  const socialLinks = [
    { url: social.facebook, icon: svgToBase64(facebookSvg), label: "Facebook" },
    { url: social.twitter, icon: svgToBase64(twitterSvg), label: "Twitter" },
    { url: social.linkedin, icon: svgToBase64(linkedinSvg), label: "LinkedIn" },
    { url: social.youtube, icon: svgToBase64(youtubeSvg), label: "Youtube" },
    {
      url: social.instagram,
      icon: svgToBase64(instagramSvg),
      label: "Instagram",
    },
    { url: social.tiktok, icon: svgToBase64(tiktokSvg), label: "Tiktok" },
  ].filter((link) => link.url);

  const imageUrl =
    layout === "profile-photo"
      ? card.profilePhoto
      : layout === "company-logo"
      ? card.companyLogo
      : "";

  const isLogoPhotoLayout = layout === "logo-photo-text";

  return `
<table cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.4; border-top: 2px solid ${brandColor}; border-bottom: 2px solid ${brandColor}; padding: 15px 0;">
  <tr>
    <td>
      <div style="margin-bottom: 10px;">
        <div style="font-weight: bold; font-size: 16px; color: ${brandColor};">${
    profile.company
  }</div>
        ${
          profile.companySlogan
            ? `<div style="font-style: italic; color: #666; font-size: 12px;">"${profile.companySlogan}"</div>`
            : ""
        }
      </div>
      
      <table cellpadding="0" cellspacing="0">
        <tr>
          ${
            isLogoPhotoLayout
              ? `
            <td style="vertical-align: top; padding-right: 15px;">
              <img src="${card.companyLogo}" alt="${profile.company}" style="width: 50px; max-width: 50px; height: auto; border-radius: 4px; object-fit: cover;">
            </td>
            <td style="vertical-align: top; padding-right: 15px;">
              <div style="width: 1px; height: 50px; background-color: ${brandColor}; margin: 0 8px;"></div>
            </td>
            <td style="vertical-align: top; padding-right: 15px;">
              <img src="${card.profilePhoto}" alt="${fullName}" style="width: 50px; max-width: 50px; height: auto; border-radius: 50%; object-fit: cover;">
            </td>
          `
              : imageUrl
              ? `<td style="vertical-align: top; padding-right: 15px;">
            <img src="${imageUrl}" alt="${
                  layout === "profile-photo" ? fullName : profile.company
                }" style="width: 50px; max-width: 50px; height: auto; border-radius: ${
                  layout === "profile-photo" ? "50%" : "4px"
                }; object-fit: cover;">
          </td>`
              : ""
          }
          <td style="vertical-align: top;">
            <div style="font-weight: bold; color: ${brandColor}; margin-bottom: 2px;">${fullName}</div>
            <div style="color: #333; margin-bottom: 2px;">${titleDept} - ${location}</div>
            <div style="margin-bottom: 5px;">
              <span style="color: #666;">${business.phone}</span> | 
              <a href="mailto:${
                business.email
              }" style="color: ${brandColor}; text-decoration: none;">${
    business.email
  }</a> | 
              <a href="${
                business.website
              }" style="color: ${brandColor}; text-decoration: none;">${
    business.website
  }</a>
            </div>
            ${
              socialLinks.length > 0
                ? `
            <div>
              ${socialLinks
                .map(
                  (link) =>
                    `<a href="${link.url}" style="color: ${brandColor}; text-decoration: none; margin-right: 8px; font-weight: bold;"><img src="${link.icon}" height="16px" width="16px"></a>`
                )
                .join("")}
            </div>
            `
                : ""
            }
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();
}
