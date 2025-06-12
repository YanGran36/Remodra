import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Clock, CreditCard, Users, Star } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

const PricingPage = () => {
  const { user } = useAuth();

  const plans = [
    {
      name: "Basic",
      price: 29,
      description: "Perfect for small contractors just getting started",
      features: [
        "Up to 10 clients",
        "Unlimited estimates & invoices",
        "Client portal access",
        "Basic support"
      ],
      limitations: [
        "No AI cost analysis",
        "No time clock",
        "No Stripe integration"
      ],
      icon: Users,
      color: "blue",
      popular: false
    },
    {
      name: "Pro",
      price: 59,
      description: "Most popular for growing contractor businesses",
      features: [
        "Up to 50 clients",
        "AI-generated estimates",
        "Time clock functionality",
        "Custom client portal",
        "10 AI analyses per month",
        "Priority support"
      ],
      limitations: [
        "No Stripe integration",
        "Limited AI usage"
      ],
      icon: Zap,
      color: "green",
      popular: true
    },
    {
      name: "Business",
      price: 99,
      description: "Complete solution for established contractors",
      features: [
        "Unlimited clients",
        "Unlimited AI cost analysis",
        "Stripe integration",
        "Fully branded portal",
        "Time clock functionality",
        "Premium support",
        "Custom integrations"
      ],
      limitations: [],
      icon: Crown,
      color: "purple",
      popular: false
    }
  ];

  const handleSubscribe = (planName: string) => {
    if (!user) {
      // Redirect to register/login with plan selection
      window.location.href = `/auth?plan=${planName.toLowerCase()}`;
      return;
    }
    
    // If user is logged in, redirect to billing/upgrade page
    window.location.href = `/billing/upgrade?plan=${planName.toLowerCase()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your <span className="text-blue-600">Remodra</span> Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Powerful contractor management tools that grow with your business. 
            Start your 14-day free trial today.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            return (
              <Card 
                key={plan.name} 
                className={`relative overflow-hidden ${
                  plan.popular 
                    ? 'border-2 border-green-500 shadow-2xl scale-105' 
                    : 'border shadow-lg hover:shadow-xl transition-shadow'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-center py-2 text-sm font-semibold">
                    <Star className="inline h-4 w-4 mr-1" />
                    Most Popular
                  </div>
                )}
                
                <CardHeader className={`text-center ${plan.popular ? 'pt-12' : 'pt-8'}`}>
                  <div className={`mx-auto mb-4 p-3 rounded-full bg-${plan.color}-100 dark:bg-${plan.color}-900`}>
                    <IconComponent className={`h-8 w-8 text-${plan.color}-600`} />
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">/month</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-green-700 dark:text-green-400">
                      Included Features:
                    </h4>
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Limitations */}
                  {plan.limitations.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-500 dark:text-gray-400">
                        Not Included:
                      </h4>
                      {plan.limitations.map((limitation, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="h-4 w-4 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {limitation}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button 
                    onClick={() => handleSubscribe(plan.name)}
                    className={`w-full mt-6 ${
                      plan.popular 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : `bg-${plan.color}-600 hover:bg-${plan.color}-700`
                    }`}
                    size="lg"
                  >
                    {user ? 'Upgrade Now' : 'Start Free Trial'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Comparison */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Feature Comparison
          </h2>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Features</th>
                    <th className="px-6 py-4 text-center font-semibold">Basic</th>
                    <th className="px-6 py-4 text-center font-semibold">
                      Pro
                      <Badge className="ml-2 bg-green-500">Popular</Badge>
                    </th>
                    <th className="px-6 py-4 text-center font-semibold">Business</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  <tr>
                    <td className="px-6 py-4 font-medium">Client Management</td>
                    <td className="px-6 py-4 text-center">Up to 10</td>
                    <td className="px-6 py-4 text-center">Up to 50</td>
                    <td className="px-6 py-4 text-center">Unlimited</td>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-gray-700/50">
                    <td className="px-6 py-4 font-medium">AI Cost Analysis</td>
                    <td className="px-6 py-4 text-center">-</td>
                    <td className="px-6 py-4 text-center">10/month</td>
                    <td className="px-6 py-4 text-center">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Time Clock</td>
                    <td className="px-6 py-4 text-center">-</td>
                    <td className="px-6 py-4 text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-gray-700/50">
                    <td className="px-6 py-4 font-medium">Stripe Integration</td>
                    <td className="px-6 py-4 text-center">-</td>
                    <td className="px-6 py-4 text-center">-</td>
                    <td className="px-6 py-4 text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Branded Portal</td>
                    <td className="px-6 py-4 text-center">Basic</td>
                    <td className="px-6 py-4 text-center">Custom</td>
                    <td className="px-6 py-4 text-center">Fully Branded</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            <div>
              <h3 className="font-semibold mb-2">Can I change plans later?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! You can upgrade or downgrade your plan at any time from your account settings.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                All plans include a 14-day free trial. No credit card required to start.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We accept all major credit cards and PayPal through our secure payment processor.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, you can cancel your subscription at any time. Your data will remain accessible until your billing period ends.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
            <p className="text-xl mb-6">Join thousands of contractors already using Remodra</p>
            <div className="space-x-4">
              <Button 
                onClick={() => handleSubscribe('Pro')}
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                Start Free Trial
              </Button>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;