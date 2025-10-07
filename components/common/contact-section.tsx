"use client"

import React from "react"
import { Button } from "@/components/ui/button"

const ContactSection: React.FC = () => (
  <section
    id="contact"
    className="container mx-auto flex flex-col items-center justify-center px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
  >
    <h2 className="text-3xl font-bold text-center">Contact Us</h2>
    <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
      Have questions or ready to book your stay? Get in touch and we'll be happy to assist you.
    </p>

    <div className="mt-10 grid w-full gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <div>
          <div className="font-medium">Phone</div>
          <div className="text-muted-foreground">09197812697</div>
        </div>
        <div>
          <div className="font-medium">Email</div>
          <div className="text-muted-foreground">SereneStayInn@gmail.com</div>
        </div>
        <div>
          <div className="font-medium">Address</div>
          <div className="text-muted-foreground">
            Purok Kalipay, Gabayan Street, San Manuel, Puerto Princesa City, Palawan 5300
          </div>
        </div>
        <div>
          <div className="font-medium">Reception Hours</div>
          <div className="text-muted-foreground">24/7 - We're always here to help</div>
        </div>
      </div>

      <form className="space-y-4" aria-label="Contact form">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="contact-first-name" className="sr-only">
              First Name
            </label>
            <input
              id="contact-first-name"
              name="firstName"
              placeholder="First Name"
              autoComplete="given-name"
              className="h-10 w-full rounded-md border bg-transparent px-3"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="contact-last-name" className="sr-only">
              Last Name
            </label>
            <input
              id="contact-last-name"
              name="lastName"
              placeholder="Last Name"
              autoComplete="family-name"
              className="h-10 w-full rounded-md border bg-transparent px-3"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="contact-email" className="sr-only">
            Email Address
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            placeholder="Email Address"
            autoComplete="email"
            className="h-10 w-full rounded-md border bg-transparent px-3"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="contact-phone" className="sr-only">
            Phone Number
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            placeholder="Phone Number"
            autoComplete="tel"
            className="h-10 w-full rounded-md border bg-transparent px-3"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="contact-subject" className="sr-only">
            Subject
          </label>
          <input
            id="contact-subject"
            name="subject"
            placeholder="Subject"
            className="h-10 w-full rounded-md border bg-transparent px-3"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="contact-message" className="sr-only">
            Your message
          </label>
          <textarea
            id="contact-message"
            name="message"
            placeholder="Your message..."
            className="min-h-32 w-full rounded-md border bg-transparent p-3"
          />
        </div>

        <Button type="submit" className="w-full">
          Send Message
        </Button>
      </form>
    </div>
  </section>
)

export default ContactSection;
