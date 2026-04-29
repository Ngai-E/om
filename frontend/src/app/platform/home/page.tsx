'use client';

import Link from 'next/link';
import {
  Store,
  Zap,
  Shield,
  Globe,
  BarChart3,
  Truck,
  CreditCard,
  Palette,
  ArrowRight,
  CheckCircle,
  Star,
} from 'lucide-react';

const features = [
  {
    icon: Store,
    title: 'Your Own Online Store',
    description: 'Launch a fully branded e-commerce storefront in minutes. No coding required.',
  },
  {
    icon: Palette,
    title: 'Custom Branding',
    description: 'Your logo, colors, and domain. Every store looks unique to your brand.',
  },
  {
    icon: Truck,
    title: 'Delivery Management',
    description: 'Delivery zones, time slots, capacity planning and real-time tracking built in.',
  },
  {
    icon: CreditCard,
    title: 'Payments & Orders',
    description: 'Accept cards, cash on delivery, and in-store payments. Full order lifecycle.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Track revenue, inventory, customers, and orders from your admin dashboard.',
  },
  {
    icon: Globe,
    title: 'Custom Domain',
    description: 'Use your own domain (yourdomain.com) or get a free subdomain on our platform.',
  },
];

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    period: '14-day trial',
    features: ['Up to 50 products', '100 orders/month', 'Free subdomain', 'Email support'],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Growth',
    price: '£29',
    period: '/month',
    features: ['Up to 500 products', 'Unlimited orders', 'Custom domain', 'Priority support', 'Promotions & coupons', 'Analytics dashboard'],
    cta: 'Get Started',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    features: ['Unlimited products', 'Unlimited orders', 'Multiple domains', 'Dedicated support', 'API access', 'White-label option'],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function PlatformHomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">OMEGA Platform</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition"
              >
                Sign In
              </Link>
              <Link
                href="/platform/signup"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Create Your Store
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full mb-6">
              <Zap className="w-4 h-4" />
              Launch your store in under 5 minutes
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Build Your Online Store.{' '}
              <span className="text-blue-600">Start Selling Today.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              OMEGA Platform gives you everything you need to run a successful online store — 
              products, orders, delivery, payments, and customers — all in one place.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/platform/signup"
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
              >
                Create Your Store — Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#features"
                className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 text-lg font-semibold rounded-xl hover:bg-gray-50 transition border flex items-center justify-center gap-2"
              >
                See Features
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              No credit card required. 14-day free trial on all plans.
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-y bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-gray-900">500+</p>
              <p className="text-sm text-gray-500">Active Stores</p>
            </div>
            <div className="w-px h-10 bg-gray-300 hidden sm:block" />
            <div>
              <p className="text-3xl font-bold text-gray-900">50,000+</p>
              <p className="text-sm text-gray-500">Orders Processed</p>
            </div>
            <div className="w-px h-10 bg-gray-300 hidden sm:block" />
            <div>
              <p className="text-3xl font-bold text-gray-900">£2M+</p>
              <p className="text-sm text-gray-500">Revenue Generated</p>
            </div>
            <div className="w-px h-10 bg-gray-300 hidden sm:block" />
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              ))}
              <span className="ml-2 text-sm text-gray-500">4.9/5 rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything You Need to Sell Online
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From product management to delivery logistics — we handle the tech so you can focus on your business.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="p-6 rounded-2xl border bg-white hover:shadow-lg transition group"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition">
                    <Icon className="w-6 h-6 text-blue-600 group-hover:text-white transition" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Up and Running in 3 Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Create Your Store',
                description: 'Pick a name, choose your subdomain, and sign up. Your store is live instantly.',
              },
              {
                step: '2',
                title: 'Add Your Products',
                description: 'Upload products with images, set prices, manage inventory, and organize categories.',
              },
              {
                step: '3',
                title: 'Start Selling',
                description: 'Share your store link, accept orders, manage deliveries, and grow your business.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Start free, upgrade as you grow. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 ${
                  plan.highlighted
                    ? 'bg-blue-600 text-white ring-4 ring-blue-600 ring-offset-4 scale-105'
                    : 'bg-white border'
                }`}
              >
                <h3 className={`text-lg font-semibold ${plan.highlighted ? 'text-blue-100' : 'text-gray-500'}`}>
                  {plan.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={`text-sm ${plan.highlighted ? 'text-blue-200' : 'text-gray-400'}`}>
                    {plan.period}
                  </span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? 'text-blue-200' : 'text-green-500'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/platform/signup"
                  className={`mt-8 block text-center py-3 rounded-xl font-semibold transition ${
                    plan.highlighted
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to Launch Your Store?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Join hundreds of store owners already selling on OMEGA Platform.
            Start your 14-day free trial today.
          </p>
          <Link
            href="/platform/signup"
            className="mt-8 inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-xl hover:bg-blue-50 transition shadow-lg"
          >
            Create Your Store — It&apos;s Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-blue-400" />
                <span className="text-lg font-bold text-white">OMEGA Platform</span>
              </div>
              <p className="text-sm">
                The all-in-one platform for launching and growing your online store.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="hover:text-white transition">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition">Pricing</Link></li>
                <li><Link href="/platform/signup" className="hover:text-white transition">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} OMEGA Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
