import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/hooks/use-theme";
import { WalletProvider } from "@/hooks/use-wallet";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Explore from "@/pages/explore";
import Settings from "@/pages/settings";
import Notifications from "@/pages/notifications";
import Bookmarks from "@/pages/bookmarks";
import Messages from "@/pages/messages";
import Create from "@/pages/create";
import Profile from "@/pages/profile";
import Support from "@/pages/support";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/explore" component={Explore} />
      <Route path="/settings" component={Settings} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/bookmarks" component={Bookmarks} />
      <Route path="/messages" component={Messages} />
      <Route path="/create" component={Create} />
      <Route path="/profile" component={Profile} />
      <Route path="/support" component={Support} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <WalletProvider>
          <Router />
          <Toaster />
        </WalletProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
