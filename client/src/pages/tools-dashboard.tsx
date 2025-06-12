import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BotIcon, 
  Palette, 
  ClipboardCheckIcon, 
  ArrowRight,
  PaintBucket,
  FileText,
  Settings,
  Layout,
  Brush,
  Users
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export default function ToolsDashboard() {
  const { t } = useLanguage();
  
  const tools = [
    {
      id: "ai-assistant",
      title: t('navigation.aiAssistant'),
      description: "Get intelligent recommendations and analysis for your projects",
      icon: <BotIcon className="h-12 w-12 text-primary" />,
      link: "/ai-assistant",
      color: "bg-gradient-to-br from-green-500/10 to-teal-500/10",
      borderColor: "border-green-200 dark:border-green-800",
      actions: [
        {
          label: "Open AI Assistant",
          link: "/ai-assistant"
        }
      ]
    },
    {
      id: "vendor-form",
      title: t('navigation.vendorForm'),
      description: "Create professional vendor estimate forms with dynamic fields",
      icon: <ClipboardCheckIcon className="h-12 w-12 text-primary" />,
      link: "/vendor-estimate-form-new",
      color: "bg-gradient-to-br from-amber-500/10 to-orange-500/10",
      borderColor: "border-amber-200 dark:border-amber-800",
      actions: [
        {
          label: "Create Vendor Form",
          link: "/vendor-estimate-form-new"
        }
      ]
    },
    {
      id: "agent-management",
      title: "Agent Management",
      description: "Manage field agents, schedule appointments, and track agent availability",
      icon: <Users className="h-12 w-12 text-primary" />,
      link: "/agents",
      color: "bg-gradient-to-br from-blue-500/10 to-indigo-500/10",
      borderColor: "border-blue-200 dark:border-blue-800",
      actions: [
        {
          label: "Manage Agents",
          link: "/agents"
        }
      ]
    }
  ];

  return (
    <div className="container py-6">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold">Tools & Customization</h1>
        <p className="text-muted-foreground">
          Customize documents and use AI-powered tools to enhance your workflow
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {tools.map((tool) => (
          <Card 
            key={tool.id} 
            className={`border ${tool.borderColor} ${tool.color} overflow-hidden transition-all hover:shadow-md`}
          >
            <CardHeader className="pb-2">
              <div className="mb-4">
                {tool.icon}
              </div>
              <CardTitle className="text-xl">{tool.title}</CardTitle>
              <CardDescription>{tool.description}</CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col items-stretch gap-2 pt-2">
              {tool.actions.map((action, i) => (
                <Link key={i} href={action.link} className="w-full">
                  <Button variant="default" className="w-full justify-between">
                    {action.label}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              ))}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Recent Templates section removed as requested */}
    </div>
  );
}