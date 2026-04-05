import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Home, Search } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1
            className="text-9xl font-black text-[#036637] mb-4"
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
          >
            404
          </h1>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for. The page might have been moved or doesn't exist.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button className="bg-[#036637] hover:bg-[#014D29] text-white w-full sm:w-auto">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
          <Link to="/products">
            <Button
              variant="outline"
              className="border-[#FF7730] text-[#FF7730] hover:bg-[#FFF5F0] w-full sm:w-auto"
            >
              <Search className="w-4 h-4 mr-2" />
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
