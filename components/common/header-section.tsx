import Link from 'next/link';
import { IconDiamond, IconMenu2, IconX, IconUserFilled, IconLogout } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { BookingSheet } from '@/components/booking/booking-sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';

interface HeaderSectionProps {
  user: { name: string; email: string; role?: string } | null;
  isLoading: boolean;
  isClient: boolean;
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onCloseMobileMenu: () => void;
  onBookingClick: (e: React.MouseEvent) => void;
  onLogout: () => void;
}

export default function HeaderSection({
  user,
  isLoading,
  isClient,
  isMobileMenuOpen,
  onToggleMobileMenu,
  onCloseMobileMenu,
  onBookingClick,
  onLogout,
}: HeaderSectionProps) {
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const handleLogoutClick = () => {
    setIsLogoutDialogOpen(true);
  };

  const handleLogoutConfirm = () => {
    onLogout();
    setIsLogoutDialogOpen(false);
    onCloseMobileMenu(); // Close mobile menu if open
  };

  const handleLogoutCancel = () => {
    setIsLogoutDialogOpen(false);
  };
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-nowrap"
        >
          <IconDiamond className="h-8 w-8" />
          <span>Amethyst Inn</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center justify-center gap-6 lg:gap-8 lg:ml-20 ">
          <Link
            href="/"
            className="relative text-sm font-medium transition-colors hover:text-primary group"
          >
            Home
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link
            href="/#about"
            className="relative text-sm font-medium transition-colors hover:text-primary group"
          >
            About
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link
            href="/#rooms"
            className="relative text-sm font-medium transition-colors hover:text-primary group"
          >
            Rooms
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link
            href="/#testimonials"
            className="relative text-sm font-medium transition-colors hover:text-primary group"
          >
            Testimonials
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link
            href="/#amenities"
            className="relative text-sm font-medium transition-colors hover:text-primary group"
          >
            Amenities
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link
            href="/#contact"
            className="relative text-sm font-medium transition-colors hover:text-primary group"
          >
            Contact
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
          </Link>
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-2">
          {isClient && !isLoading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <IconUserFilled className="h-4 w-4" />
                      <span className="hidden sm:inline">{user.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href={user.role === 'admin' || user.role === 'staff' ? '/dashboard' : '/profile'}
                        className="flex items-center gap-2"
                      >
                        <IconUserFilled className="h-4 w-4" />
                        {user.role === 'admin' || user.role === 'staff' ? 'Dashboard' : 'Profile'}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/login?force=1"
                        className="flex items-center gap-2"
                        onClick={onCloseMobileMenu}
                      >
                        <IconUserFilled className="h-4 w-4" />
                        Switch account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogoutClick}
                      className="flex items-center gap-2"
                    >
                      <IconLogout className="h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link href="/login?force=1">
                    <Button variant="outline" size="sm">
                      Login
                    </Button>
                  </Link>
                </>
              )}
              {user ? (
                <BookingSheet>
                  <Button size="sm">Book Now</Button>
                </BookingSheet>
              ) : (
                <Button size="sm" onClick={onBookingClick}>
                  Book Now
                </Button>
              )}
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <ModeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleMobileMenu}
            className="p-2"
          >
            {isMobileMenuOpen ? (
              <IconX className="h-5 w-5" />
            ) : (
              <IconMenu2 className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Desktop Mode Toggle */}
        <div className="hidden md:flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur">
          <nav className="container mx-auto px-4 py-4 space-y-4">
            <Link
              href="/"
              className="block py-2 text-sm font-medium transition-colors hover:text-primary hover:underline"
              onClick={onCloseMobileMenu}
            >
              Home
            </Link>
            <Link
              href="/#about"
              className="block py-2 text-sm font-medium transition-colors hover:text-primary hover:underline"
              onClick={onCloseMobileMenu}
            >
              About
            </Link>
            <Link
              href="/#rooms"
              className="block py-2 text-sm font-medium transition-colors hover:text-primary hover:underline"
              onClick={onCloseMobileMenu}
            >
              Rooms
            </Link>
            <Link
              href="/#testimonials"
              className="block py-2 text-sm font-medium transition-colors hover:text-primary hover:underline"
              onClick={onCloseMobileMenu}
            >
              Testimonials
            </Link>
            <Link
              href="/#amenities"
              className="block py-2 text-sm font-medium transition-colors hover:text-primary hover:underline"
              onClick={onCloseMobileMenu}
            >
              Amenities
            </Link>
            <Link
              href="/#contact"
              className="block py-2 text-sm font-medium transition-colors hover:text-primary hover:underline"
              onClick={onCloseMobileMenu}
            >
              Contact
            </Link>
            <div className="pt-4 border-t space-y-3">
              {isClient && !isLoading && (
                <>
                  {user ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <IconUserFilled className="h-6 w-6 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={user.role === 'admin' || user.role === 'staff' ? '/dashboard' : '/profile'}
                        className="block"
                        onClick={onCloseMobileMenu}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full flex items-center gap-2"
                        >
                          <IconUserFilled className="h-4 w-4" />
                          {user.role === 'admin' || user.role === 'staff' ? 'Dashboard' : 'Profile'}
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full flex items-center gap-2"
                        onClick={handleLogoutClick}
                      >
                        <IconLogout className="h-4 w-4" />
                        Log out
                      </Button>
                    </div>
                  ) : (
                    <Link href="/login?force=1" className="block">
                      <Button variant="outline" size="sm" className="w-full">
                        Login
                      </Button>
                    </Link>
                  )}
                </>
              )}
              {user ? (
                <BookingSheet>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={onCloseMobileMenu}
                  >
                    Book Now
                  </Button>
                </BookingSheet>
              ) : (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    onBookingClick(e);
                    onCloseMobileMenu();
                  }}
                >
                  Book Now
                </Button>
              )}
              {isClient && user && (
                <Link
                  href="/login?force=1"
                  className="block"
                  onClick={onCloseMobileMenu}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full flex items-center gap-2"
                  >
                    <IconUserFilled className="h-4 w-4" />
                    Switch account
                  </Button>
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
      {/* Logout Confirmation Dialog */}
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out? You will need to sign in again to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleLogoutCancel}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogoutConfirm}>
              Log out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
