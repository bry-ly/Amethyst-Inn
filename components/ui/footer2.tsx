"use client"

import { IconBrandFacebook, IconBrandInstagram, IconBrandX, IconDiamond } from "@tabler/icons-react";

interface MenuItem {
  title: string;
  links: {
    icon?: React.ElementType;
    text: string;
    url: string;
  }[];
}

interface Footer2Props {
  logo?: {
    url: string;
    icon?: React.ElementType;
    src?: string;
    alt: string;
    title: string;
  };
  tagline?: string;
  menuItems?: MenuItem[];
  copyright?: string;
  bottomLinks?: {
    text: string;
    url: string;
  }[];
}

const Footer2 = ({
  logo = {
    icon: IconDiamond,
    alt: "Amethyst Inn",
    title: "Amethyst Inn",
    url: "#",
  },
  tagline = "Experience the best of nature in the heart of the city.",
  menuItems = [
    {
      title: "Navigation",
      links: [
        { text: "Home", url: "#hero" },
        { text: "About", url: "#about" },
        { text: "Rooms", url: "#rooms" },
        { text: "Testimonials", url: "#testimonials" },
        { text: "Contact", url: "#contact" },
      ],
    },
    {
      title: "Policies",
      links: [
        { text: "Cancellation Policy", url: "#" },
        { text: "Privacy Policy", url: "#" },
        { text: "Refund Policy", url: "#" },
        { text: "Terms of Service", url: "#" },
        { text: "Contact", url: "/contact" },
        { text: "Privacy", url: "#" },
      ],
    },
    {
      title: "Contact",
      links: [
        { text: "Address", url: "https://maps.app.goo.gl/uiZGCzFfLYrsD5Ep6" },
        { text: "Contact Us", url: "/contact" },
        { text: "FAQ", url: "#" },
      ],
    },
    {
      title: "Follow Us",
      links: [
        { icon: IconBrandFacebook, text: "Facebook", url: "#" },
        { icon: IconBrandInstagram, text: "Instagram", url: "#" },
      ],
    },
  ],
  copyright = "© 2025 Amethyst Inn. All rights reserved.",
  bottomLinks = [
    { text: "Terms and Conditions", url: "#" },
    { text: "Privacy Policy", url: "#" },
  ],
}: Footer2Props) => {
  const LogoIcon = logo.icon;
  return (
    <section className="py-32">
      <div className="container">
        <footer>
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-6">
            <div className="col-span-2 mb-8 lg:mb-0">
              <div className="flex items-center gap-2 lg:justify-start">
                <a
                  href={logo.url}
                  className="flex items-center gap-2"
                  aria-label={logo.title}
                >
                  {LogoIcon ? (
                    <LogoIcon className="h-10 w-10" />
                  ) : (
                    <img
                      src={logo.src}
                      alt={logo.alt}
                      title={logo.title}
                      className="h-10"
                    />
                  )}
                  <span className="text-xl">{logo.title}</span>
                </a>
              </div>
              <p className="mt-4 font-bold">{tagline}</p>
            </div>
            {menuItems.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <h3 className="mb-4 font-bold">{section.title}</h3>
                <ul className="text-muted-foreground space-y-4">
                  {section.links.map((link, linkIdx) => (
                    <li
                      key={linkIdx}
                      className="hover:text-primary font-medium"
                    >
                      <a
                        href={link.url}
                        className="inline-flex items-center gap-2"
                      >
                        {link.icon ? <link.icon className="h-4 w-4" /> : null}
                        <span>{link.text}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="text-muted-foreground mt-24 flex flex-col justify-between  gap-4 border-t pt-8 text-sm font-medium md:flex-row md:items-center ">
            <p>{copyright}</p>
            <ul className="flex gap-4">
              {bottomLinks.map((link, linkIdx) => (
                <li key={linkIdx} className="hover:text-primary underline">
                  <a href={link.url}>{link.text}</a>
                </li>
              ))}
            </ul>
          </div>
        </footer>
      </div>
    </section>
  );
};

export { Footer2 };
