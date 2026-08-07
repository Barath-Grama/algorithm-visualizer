import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { queryClient } from "@/lib/queryClient";
import { VisualizerPage } from "@/pages/VisualizerPage";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<VisualizerPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
