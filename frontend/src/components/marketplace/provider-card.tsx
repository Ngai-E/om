import React from 'react';
import { Star } from 'lucide-react';

interface ProviderCardProps {
  name: string;
  rating: number;
  specialization: string;
  avatar?: string;
}

export function ProviderCard({ name, rating, specialization, avatar }: ProviderCardProps) {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
          {avatar ? (
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg font-semibold text-muted-foreground">
              {name.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{name}</h3>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="text-sm font-medium">{rating}</span>
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{specialization}</p>
    </div>
  );
}
