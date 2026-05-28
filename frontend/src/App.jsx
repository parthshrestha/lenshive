import { useState } from "react";
import { DashboardPage, HomePage, ProfilePage, SearchPage, SpotPage } from "./pages";

export default function App() {
  const [route, setRoute] = useState({ name: "home" });

  const nav = (name, payload) => {
    if (name === "spot") {
      setRoute({ name: "spot", spotId: typeof payload === "string" ? payload : "chautauqua" });
    } else if (name === "profile") {
      setRoute({ name: "profile", photographerId: payload });
    } else if (name === "search") {
      setRoute({ name: "search", query: payload?.q, kind: payload?.kind });
    } else {
      setRoute({ name });
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const openSpot = (id) => nav("spot", id);
  const openPhotographer = (id) => nav("profile", id);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {route.name === "home" && <HomePage nav={nav} openSpot={openSpot} openPhotographer={openPhotographer} />}
      {route.name === "search" && <SearchPage nav={nav} openPhotographer={openPhotographer} initialQuery={route.query} />}
      {route.name === "spot" && <SpotPage nav={nav} spotId={route.spotId} openPhotographer={openPhotographer} />}
      {route.name === "profile" && <ProfilePage nav={nav} photographerId={route.photographerId} openSpot={openSpot} />}
      {route.name === "dashboard" && <DashboardPage nav={nav} openPhotographer={openPhotographer} />}
    </div>
  );
}
