"use client";
import React from 'react';
import { BusinessCard } from '@/types/businessCard';
import { Calendar, Mail, Phone } from 'lucide-react';
import { getFullName } from '@/utils/businessCard';
import { format } from 'date-fns';
import { CardListActions } from './CardListActions';

interface CardListItemProps {
  card: BusinessCard;
  onAction: (action: 'edit' | 'delete' | 'share' | 'view' | 'analytics' | 'preview', card: BusinessCard) => void;
  onToggleFavorite: (cardId: string) => void;
  showViewOnly?: boolean;
  onProFeatureClick: (featureName: string) => void;
  defaultAction?: 'view' | 'preview';
  activeTab?:string;
}

export function CardListItem({ card, onAction, onToggleFavorite, showViewOnly, onProFeatureClick, defaultAction = 'preview',activeTab }: CardListItemProps) {
  return (
    <div
      className="bg-card rounded-lg shadow-sm border border-border p-2 hover:shadow-md transition-shadow cursor-pointer"
      style={{ borderLeft: `4px solid ${card.brandColor}` }}
      onClick={() => onAction(defaultAction, card)}
    >
      <div className="flex items-center gap-4">
        {/* Avatar with brand color background */}
        <div className="relative">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: card.brandColor }}
          >
            {card.profilePhoto ? (
              <img
                src={card.profilePhoto}
                alt={getFullName(card)}
                className="w-full h-full rounded-full object-cover object-center"
              />
            ) : (
              <span className="text-white font-bold text-sm">
                {getFullName(card).split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">
            {getFullName(card)}
          </h3>
          <div className="text-sm mt-0.5">
            <span style={{ color: card.brandColor }}>{card.profile.title}</span>
            {card.profile.company && (
              <>
                <span className="mx-1">•</span>
                <span className="font-medium">{card.profile.company}</span>
              </>
            )}
          </div>
          <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
            {card.business.email && (
              <div className="flex items-center gap-1">
                <Mail size={14} style={{ color: card.brandColor }} />
                <span className="truncate">{card.business.email}</span>
              </div>
            )}
            {card.business.phone && (
              <div className="flex items-center gap-1">
                <Phone size={14} style={{ color: card.brandColor }} />
                <span>{card.business.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="hidden sm:flex items-center gap-2">
          {card.metadata?.tags?.map(tag => (
            <span
              key={tag}
              className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs whitespace-nowrap"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Public/Private Label */}
        {!showViewOnly && (
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs ${
              card.metadata?.isPublic
                ? 'bg-green-100 text-green-700'
                : 'bg-muted text-muted-foreground'
            }`}>
              {card.metadata?.isPublic ? 'Public' : 'Private'}
            </span>
          </div>
        )}

        {/* Actions */}
        {!showViewOnly && (
          <CardListActions
            card={card}
            onAction={onAction}
            onProFeatureClick={onProFeatureClick}
            activeTab={activeTab}
          />
        )}
      </div>

      {/* Mobile Tags */}
      {card.metadata?.tags && card.metadata.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 sm:hidden">
          {card.metadata.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Metadata */}
      <div className="mt-2 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span className="text-foreground font-bold">{card.urlName || 'Untitled Card'}</span>
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{format(new Date(card.metadata?.createdAt || ''), 'MMM d, yyyy').toUpperCase()}</span>
          </div>
        </div>
        {card.metadata?.lastInteraction && (
          <span className="block mt-1">
            Last interaction: {new Date(card.metadata.lastInteraction).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}