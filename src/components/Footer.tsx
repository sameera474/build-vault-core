import { Link } from 'react-router-dom';
import { HardHat } from 'lucide-react';

const navigation = [
  { name: 'About', href: '/about' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Contact', href: '/contact' },
  { name: 'Sign In', href: '/sign-in' },
];

export function Footer() {
  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex justify-center space-x-6 md:order-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="text-muted-foreground hover:text-foreground transition-smooth"
            >
              {item.name}
            </Link>
          ))}
        </div>
        <div className="mt-8 md:order-1 md:mt-0">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <HardHat className="h-6 w-6 text-primary" />
            <p className="text-center text-sm leading-5 text-muted-foreground">
              &copy; 2025 ConstructTest Pro. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}