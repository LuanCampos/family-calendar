import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { FamilyProvider } from "@/contexts/FamilyContext";
import { OnlineProvider } from "@/contexts/OnlineContext";
import { CalendarProvider } from "@/contexts/CalendarContext";
import Index from "./pages/Index";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <OnlineProvider>
            <FamilyProvider>
              <CalendarProvider>
                <TooltipProvider>
                  <div className="h-screen w-screen overflow-hidden">
                    <Toaster />
                    <Sonner />
                    <Index />
                  </div>
                </TooltipProvider>
              </CalendarProvider>
            </FamilyProvider>
          </OnlineProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
