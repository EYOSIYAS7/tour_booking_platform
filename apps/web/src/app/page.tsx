import Image from "next/image";
import TourList from "@/components/TourList";
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <TourList />
    </main>
  );
}
