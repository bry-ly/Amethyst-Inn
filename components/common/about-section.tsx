"use client"
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

const About: React.FC = () => (
    <section id="about" className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto grid gap-8 md:grid-cols-2 items-center">
            <div className="relative h-64 md:h-80 rounded-lg overflow-hidden shadow-lg">
                <Image
                    src="https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80"
                    alt="Amethyst Inn exterior"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    loading="lazy"
                />
            </div>

            <div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-2">About Amethyst Inn</h2>
                <p className="text-muted-foreground mb-4">
                    We combine warm hospitality with a modern management platform to
                    deliver guests a memorable stay and staff a smoother workflow.
                </p>

                <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                    Amethyst Inn System streamlines reservations, simplifies billing,
                    and centralizes operations so you can focus on what matters most —
                    welcoming your guests. Whether you run a boutique guest house or a
                    multi-room property, our tools adapt to your workflow.
                </p>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                    <li className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary mt-1" />
                        <span>Easy reservations & availability management</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary mt-1" />
                        <span>Secure payments & invoicing</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary mt-1" />
                        <span>Guest profiles & communication tools</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary mt-1" />
                        <span>Staff scheduling & housekeeping tracking</span>
                    </li>
                </ul>

                <div className="flex items-center justify-center gap-3">
                    <Link href="#contact">
                        <Button>Contact us</Button>
                    </Link>
                    <Link href="#rooms">
                        <Button variant="outline">View rooms</Button>
                    </Link>
                </div>
            </div>
        </div>
    </section>
)

export default About