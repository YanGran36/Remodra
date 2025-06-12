import PageHeader from "@/components/shared/page-header";
import { AchievementCollection } from "@/components/achievements/AchievementCollection";
import { Helmet } from "react-helmet-async";

export default function AchievementsPage() {
  return (
    <>
      <Helmet>
        <title>Logros | ContractorHub</title>
        <meta name="description" content="Sistema de logros y recompensas para contratistas" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-6">
        <PageHeader
          title="Logros y Recompensas"
          description="Desbloquea logros, gana XP y obtén recompensas mientras administras tu negocio"
        />
        
        <AchievementCollection />
      </div>
    </>
  );
}