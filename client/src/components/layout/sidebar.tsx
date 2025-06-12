import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { Link, useLocation } from "wouter";
import { 
  BuildingIcon, 
  LayoutDashboardIcon, 
  CalendarIcon, 
  UsersIcon, 
  FileTextIcon, 
  BanknoteIcon, 
  HammerIcon, 
  Drill, 
  BotIcon, 
  SettingsIcon, 
  LogOutIcon,
  ClipboardCheckIcon,
  Globe,
  TrophyIcon,
  Clock,
  Palette,
  Settings,
  FileText,
  CreditCard,
  MessageSquare
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Separator } from "@/components/ui/separator";


export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { t } = useLanguage();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isActivePath = (path: string) => {
    return location === path;
  };

  const getLinkClass = (path: string) => {
    return `flex items-center px-4 py-3 mx-2 my-1 rounded-xl transition-all duration-300 ease-in-out group ${
      isActivePath(path) 
        ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-400/30 shadow-lg backdrop-blur-sm" 
        : "text-slate-300 hover:bg-white/10 hover:text-white hover:shadow-md hover:scale-105 hover:translate-x-1"
    }`;
  };

  const getInitials = () => {
    if (!user) return "U";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`;
  };

  return (
    <aside className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white w-64 flex-shrink-0 hidden lg:flex flex-col h-screen shadow-2xl backdrop-blur-xl border-r border-slate-700/50">
      <div className="p-6 flex items-center border-b border-slate-700/50 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-3 mr-4 shadow-lg">
          <BuildingIcon className="text-white h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          ContractorHub
        </h1>
      </div>
      
      <div className="py-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
        <nav className="space-y-1">
          <Link href="/" className={getLinkClass("/")}>
            <LayoutDashboardIcon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link href="/calendar" className={getLinkClass("/calendar")}>
            <CalendarIcon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-medium">Calendar</span>
          </Link>
          <Link href="/clients" className={getLinkClass("/clients")}>
            <UsersIcon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-medium">Clients</span>
          </Link>
          <Link href="/estimates" className={getLinkClass("/estimates")}>
            <FileTextIcon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-medium">Estimates</span>
          </Link>
          <Link href="/invoices" className={getLinkClass("/invoices")}>
            <BanknoteIcon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-medium">Invoices</span>
          </Link>
          
          {/* Tools & Settings section with divider */}
          <div className="mt-6 mb-3 px-4">
            <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mt-3 mb-2">
              Tools & Settings
            </div>
          </div>
          <Link href="/projects" className={getLinkClass("/projects")}>
            <HammerIcon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-medium">Projects</span>
          </Link>
          <Link href="/materials" className={getLinkClass("/materials")}>
            <Drill className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-medium">Materials</span>
          </Link>
          <Link href="/timeclock" className={getLinkClass("/timeclock")}>
            <Clock className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-medium">Time Clock</span>
          </Link>
          <Link href="/ai-assistant" className={getLinkClass("/ai-assistant")}>
            <BotIcon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-medium">AI Assistant</span>
          </Link>
          <Link href="/settings" className={getLinkClass("/settings")}>
            <SettingsIcon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-medium">Settings</span>
          </Link>
        </nav>
      </div>
      
      {/* Language Switcher Section */}
      <div className="border-t border-slate-700/50 bg-slate-800/30">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Globe className="mr-2 h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-300">Language</span>
            </div>
            <LanguageSwitcher variant="ghost" showText={false} size="sm" />
          </div>
        </div>
      </div>
      
      <div className="mt-auto border-t border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm">
        {/* User Info and Logout */}
        <div className="p-4">
          <div className="flex items-center">
            <Avatar className="h-12 w-12 mr-3 ring-2 ring-blue-400/30 shadow-lg">
              <AvatarImage src="" alt={user?.firstName} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
            <button 
              className="ml-2 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 hover:scale-110"
              onClick={handleLogout}
              aria-label="Logout"
            >
              <LogOutIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
