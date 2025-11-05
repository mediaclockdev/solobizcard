import { BusinessCard } from '@/types/businessCard';
import { SignatureLayout } from './types';

export function generateSignatureHTML(card: BusinessCard, layout: SignatureLayout): string {
  const { profile, business, social } = card;
  const brandColor = card.brandColor || '#000000';
  
  const fullName = `${profile.firstName} ${profile.lastName}`;
  const location = `${business.address.city}, ${business.address.state}`;
  const titleDept = `${profile.title}${profile.department ? ` - ${profile.department}` : ''}`;
  
  // Social links array
  const socialLinks = [
    { url: social.facebook, icon: 'Facebook', label: 'Facebook' },
    { url: social.twitter, icon: 'Twitter', label: 'Twitter' },
    { url: social.linkedin, icon: 'LinkedIn', label: 'LinkedIn' },
    { url: social.instagram, icon: 'Instagram', label: 'Instagram' }
  ].filter(link => link.url);

  const imageUrl = layout === 'profile-photo' ? card.profilePhoto : 
                  layout === 'company-logo' ? card.companyLogo : '';
  
  const isLogoPhotoLayout = layout === 'logo-photo-text';

  return `
<table cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.4; border-top: 2px solid ${brandColor}; border-bottom: 2px solid ${brandColor}; padding: 15px 0;">
  <tr>
    <td>
      <div style="margin-bottom: 10px;">
        <div style="font-weight: bold; font-size: 16px; color: ${brandColor};">${profile.company}</div>
        ${profile.companySlogan ? `<div style="font-style: italic; color: #666; font-size: 12px;">"${profile.companySlogan}"</div>` : ''}
      </div>
      
      <table cellpadding="0" cellspacing="0">
        <tr>
          ${isLogoPhotoLayout ? `
            <td style="vertical-align: top; padding-right: 15px;">
              <img src="${card.companyLogo}" alt="${profile.company}" style="width: 50px; max-width: 50px; height: auto; border-radius: 4px; object-fit: cover;">
            </td>
            <td style="vertical-align: top; padding-right: 15px;">
              <div style="width: 1px; height: 50px; background-color: ${brandColor}; margin: 0 8px;"></div>
            </td>
            <td style="vertical-align: top; padding-right: 15px;">
              <img src="${card.profilePhoto}" alt="${fullName}" style="width: 50px; max-width: 50px; height: auto; border-radius: 50%; object-fit: cover;">
            </td>
          ` : imageUrl ? `<td style="vertical-align: top; padding-right: 15px;">
            <img src="${imageUrl}" alt="${layout === 'profile-photo' ? fullName : profile.company}" style="width: 50px; max-width: 50px; height: auto; border-radius: ${layout === 'profile-photo' ? '50%' : '4px'}; object-fit: cover;">
          </td>` : ''}
          <td style="vertical-align: top;">
            <div style="font-weight: bold; color: ${brandColor}; margin-bottom: 2px;">${fullName}</div>
            <div style="color: #333; margin-bottom: 2px;">${titleDept} - ${location}</div>
            <div style="margin-bottom: 5px;">
              <span style="color: #666;">${business.phone}</span> | 
              <a href="mailto:${business.email}" style="color: ${brandColor}; text-decoration: none;">${business.email}</a> | 
              <a href="${business.website}" style="color: ${brandColor}; text-decoration: none;">${business.website}</a>
            </div>
            ${socialLinks.length > 0 ? `
            <div>
              ${socialLinks.map(link => 
                `<a href="${link.url}" style="color: ${brandColor}; text-decoration: none; margin-right: 8px; font-weight: bold;">[${link.label}]</a>`
              ).join('')}
            </div>
            ` : ''}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();
}