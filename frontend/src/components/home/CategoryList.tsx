'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Category } from '@/types';

interface CategoryListProps {
  categories: Category[];
}

const CATEGORY_LIMIT = 8;

export function CategoryList({ categories }: CategoryListProps) {
  const [showAllCategories, setShowAllCategories] = React.useState(false);

  // Debug: Log categories
  React.useEffect(() => {
    console.log('CategoryList received categories:', categories);
    console.log('Categories length:', categories?.length);
  }, [categories]);

  const displayedCategories = showAllCategories 
    ? categories 
    : categories?.slice(0, CATEGORY_LIMIT);

  const gradients = [
    'from-red-50 to-orange-50',
    'from-yellow-50 to-amber-50',
    'from-green-50 to-teal-50',
    'from-blue-50 to-cyan-50',
    'from-purple-50 to-pink-50',
    'from-orange-50 to-red-50',
    'from-teal-50 to-green-50',
    'from-pink-50 to-rose-50',
    'from-indigo-50 to-blue-50',
    'from-amber-50 to-yellow-50',
    'from-lime-50 to-green-50',
    'from-rose-50 to-pink-50'
  ];
  
  const prices = ['£29.99', '£19.99', '£24.99', '£34.99', '£14.99', '£22.99', '£27.99', '£18.99', '£31.99', '£25.99', '£16.99', '£23.99'];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {displayedCategories?.map((category, index) => (
        <div key={category.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition">
          <div className={`relative h-48 bg-gradient-to-br ${gradients[index % gradients.length]}`}>
            {category.image ? (
              <Image 
                src={category.image} 
                alt={category.name} 
                fill
                className="object-cover mix-blend-multiply"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl opacity-30">📦</span>
              </div>
            )}
          </div>
          <div className="bg-pink-50 px-4 py-3 flex items-center justify-center gap-2 min-h-[60px]">
            <h3 className="text-base font-bold text-gray-900 text-center leading-tight">{category.name}</h3>
          </div>
          <div className="bg-white p-6 text-center">
            <p className="text-3xl font-black text-secondary mb-4">{prices[index % prices.length]}</p>
            <Link href={`/products?category=${category.slug}`}>
              <button className="w-full bg-primary hover:bg-primary/80 text-white py-3 rounded-lg font-bold transition">
                Shop Bundle
              </button>
            </Link>
          </div>
        </div>
      ))}
      {categories.length > CATEGORY_LIMIT && (
        <div className="col-span-full text-center mt-8">
          <button 
            onClick={() => setShowAllCategories(!showAllCategories)}
            className="text-primary font-bold border-2 border-primary px-8 py-2 rounded-lg hover:bg-primary hover:text-white transition"
          >
            {showAllCategories ? 'Show Less' : 'View All Categories'}
          </button>
        </div>
      )}
    </div>
  );
}
