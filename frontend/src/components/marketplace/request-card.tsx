import React from 'react';
import { MapPin, Clock, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface RequestCardProps {
  id: string;
  title: string;
  category?: string;
  image?: string;
  budget?: string;
  location: string;
  timePosted: string;
  status?: string;
  offers?: number;
}

export function RequestCard({ 
  id,
  title,
  category,
  image, 
  budget, 
  location, 
  timePosted, 
  status,
  offers
}: RequestCardProps) {
  return (
    <Link href={`/marketplace/requests/${id}`}>
      <div className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer p-6">
        {image && (
          <div className="h-48 bg-muted overflow-hidden rounded-lg mb-4">
            <img src={image} alt={title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            {category && (
              <div className="inline-block px-3 py-1 bg-muted text-foreground rounded-full text-sm mb-2 font-medium">
                {category}
              </div>
            )}
            <h3 className="font-semibold text-foreground mb-2">{title}</h3>
          </div>
          {status && (
            <span className="px-2 py-1 text-xs rounded-full bg-accent/10 text-accent-foreground font-medium ml-2">
              {status}
            </span>
          )}
        </div>
        
        <div className="flex items-center flex-wrap gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{location}</span>
          </div>
          {budget && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span>{budget}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{timePosted}</span>
          </div>
        </div>

        {offers !== undefined && (
          <div className="pt-4 border-t border-border">
            <span className="text-sm font-medium">{offers} offers received</span>
          </div>
        )}
      </div>
    </Link>
  );
}
