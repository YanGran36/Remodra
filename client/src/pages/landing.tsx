import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Star, 
  Users, 
  Calendar, 
  FileText, 
  Calculator,
  Clock,
  Bot,
  ArrowRight,
  Building,
  Zap,
  Shield
} from "lucide-react";

export default function Landing() {
  const { user } = useAuth();

  // If user is logged in, show them a different view but allow demo mode
  // Commenting out redirect for customer flow demonstration
  // if (user) {
  //   window.location.href = "/dashboard";
  //   return null;
  // }

  const features = [
    {
      icon: <Users className="h-6 w-6" />,
      title: "Client Management",
      description: "Keep track of all your clients in one organized place"
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Project Scheduling",
      description: "Never miss a deadline with our smart calendar system"
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Professional Estimates",
      description: "Create stunning estimates that win more projects"
    },
    {
      icon: <Calculator className="h-6 w-6" />,
      title: "Smart Invoicing",
      description: "Get paid faster with automated invoice generation"
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Time Tracking",
      description: "Track hours and manage your team efficiently"
    },
    {
      icon: <Bot className="h-6 w-6" />,
      title: "AI Cost Analysis",
      description: "Get intelligent pricing recommendations powered by AI"
    }
  ];

  const testimonials = [
    {
      name: "Mike Rodriguez",
      company: "Rodriguez Construction",
      rating: 5,
      text: "Remodra transformed how I run my business. I'm closing 40% more deals with their professional estimates."
    },
    {
      name: "Sarah Johnson",
      company: "Johnson Home Renovations", 
      rating: 5,
      text: "The AI cost analysis is incredible. It helps me price jobs perfectly and stay competitive."
    },
    {
      name: "David Chen",
      company: "Elite Remodeling",
      rating: 5,
      text: "Finally, software built specifically for contractors. Everything I need in one place."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-2 mr-3">
                <Building className="text-white h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Remodra
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link href="/plans">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-500/20 text-blue-300 border-blue-400/30">
            <Zap className="mr-2 h-4 w-4" />
            The #1 Platform for Remodeling Contractors
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Grow Your
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent block">
              Remodeling Business
            </span>
          </h1>
          
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Everything you need to manage clients, create professional estimates, track projects, 
            and grow your contracting business. Built specifically for remodeling professionals.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/plans">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth">
              <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-white/10 px-8 py-4 text-lg">
                Sign In
              </Button>
            </Link>
          </div>
          
          <p className="text-sm text-slate-400 mt-4">
            ✅ 14-day free trial • ✅ No credit card required • ✅ Cancel anytime
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Powerful tools designed specifically for remodeling contractors to streamline operations and win more projects.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-300">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Trusted by 1000+ Contractors
            </h2>
            <p className="text-xl text-slate-300">
              See what contractors are saying about Remodra
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <div className="flex items-center mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <CardDescription className="text-slate-300 text-base leading-relaxed">
                    "{testimonial.text}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-white font-semibold">{testimonial.name}</div>
                  <div className="text-slate-400 text-sm">{testimonial.company}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Join thousands of contractors who are already growing with Remodra. 
            Start your free trial today and see the difference.
          </p>
          
          <Link href="/plans">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg">
              Start Your Free Trial Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          
          <div className="flex items-center justify-center mt-6 space-x-6 text-slate-300">
            <div className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-green-400" />
              <span>Secure & Reliable</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
              <span>Cancel Anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/80 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-2 mr-3">
                <Building className="text-white h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Remodra
              </h1>
            </div>
            
            <div className="flex items-center space-x-6 text-slate-400">
              <Link href="/auth" className="hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/plans" className="hover:text-white transition-colors">
                Pricing
              </Link>
              <span className="text-sm">
                © 2024 Remodra. All rights reserved.
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}