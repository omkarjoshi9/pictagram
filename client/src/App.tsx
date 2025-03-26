import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/hooks/use-theme";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Explore from "@/pages/explore";
import Settings from "@/pages/settings";
import Notifications from "@/pages/notifications";
import Bookmarks from "@/pages/bookmarks";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/explore" component={Explore} />
      <Route path="/settings" component={Settings} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/bookmarks" component={Bookmarks} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
