import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { NewContractorForm } from "@/components/super-admin/new-contractor-form";
import { ArchitecturalContainer, ArchitecturalHeader } from "@/components/ui/architectural-card";

export default function SuperAdminAddContractor() {
  const [, navigate] = useLocation();
  const [isSuccess, setIsSuccess] = useState(false);
  const [newContractor, setNewContractor] = useState<any>(null);
  
  // Handle form success
  const handleFormSuccess = (data: any) => {
    setIsSuccess(true);
    setNewContractor(data);
  };
  
  // View all contractors
  const handleViewAllContractors = () => {
    navigate("/super-admin");
  };
  
  // View the newly created contractor details
  const handleViewContractor = () => {
    if (newContractor?.id) {
      navigate(`/super-admin/contractors/${newContractor.id}`);
    }
  };
  
  return (
    <ArchitecturalContainer>
      <ArchitecturalHeader 
        title={isSuccess ? "Contractor Created Successfully" : "Add New Contractor"} 
        description={isSuccess 
          ? `The contractor ${newContractor?.companyName} has been created successfully` 
          : "Complete the form to set up a new contractor on the platform"
        }
      >
        <div className="flex flex-wrap gap-4 mt-6">
          <Button 
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white"
            onClick={handleViewAllContractors}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </ArchitecturalHeader>
      
      <div className="container mx-auto p-6 pb-16">
        {isSuccess ? (
          <div className="space-y-8">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 animation-pulse-slow">
              <div className="flex items-center text-green-700 dark:text-green-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mr-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-xl font-bold">Contratista Registrado Exitosamente</h3>
                  <p className="text-green-600 dark:text-green-300">El contratista ha sido agregado a la plataforma y ya puede comenzar a utilizarla.</p>
                </div>
              </div>
              
              <div className="border-t border-green-200 dark:border-green-800 pt-4 mt-4">
                <h4 className="font-semibold mb-2">Contractor Details:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="font-medium w-40">Company:</span>
                    <span>{newContractor?.companyName}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium w-40">Email:</span>
                    <span>{newContractor?.email}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium w-40">Plan:</span>
                    <span className="capitalize">{newContractor?.plan}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium w-40">Primary User:</span>
                    <span>{newContractor?.firstName} {newContractor?.lastName}</span>
                  </li>
                </ul>
              </div>
              
              <div className="flex justify-end space-x-4 mt-6">
                <Button variant="outline" onClick={handleViewAllContractors}>
                  View All Contractors
                </Button>
                <Button onClick={() => setIsSuccess(false)}>
                  Add Another Contractor
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <NewContractorForm onSuccess={handleFormSuccess} />
        )}
      </div>
    </ArchitecturalContainer>
  );
}