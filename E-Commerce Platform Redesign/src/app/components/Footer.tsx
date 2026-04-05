import { Link } from 'react-router';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#036637] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-2xl font-black mb-4" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
              OMEGA
            </h3>
            <p className="text-sm text-white/90 mb-4">
              Your trusted source for authentic Afro-Caribbean groceries and specialty foods in the UK.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="hover:text-[#FF7730] transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-[#FF7730] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-[#FF7730] transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-white/90 hover:text-[#FF7730] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-white/90 hover:text-[#FF7730] transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/promotions" className="text-white/90 hover:text-[#FF7730] transition-colors">
                  Promotions
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-white/90 hover:text-[#FF7730] transition-colors">
                  My Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-white/90">Delivery Information</li>
              <li className="text-white/90">Returns Policy</li>
              <li className="text-white/90">Terms & Conditions</li>
              <li className="text-white/90">Privacy Policy</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-white/90">123 High Street, London, UK</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span className="text-white/90">+44 20 1234 5678</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="text-white/90">info@omega.co.uk</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm text-white/80">
          <p>&copy; {new Date().getFullYear()} OMEGA. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
